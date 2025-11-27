import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { Prisma } from '@prisma/client';

export const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
	const recipes = await prisma.recipe.findMany({ 
		where: { deletedAt: null },
		include: { ingredients: { include: { product: true } } }, 
		orderBy: { name: 'asc' } 
	});
	
	// Recalcular custos se necessário
	const recipesWithCosts = await Promise.all(recipes.map(async (recipe) => {
		if (recipe.totalCost === null || recipe.totalCost === 0) {
			let totalCost = 0;
			for (const ing of recipe.ingredients) {
				if (ing.product?.pricePerGram) {
					totalCost += ing.amount * ing.product.pricePerGram;
				}
			}
			if (totalCost > 0) {
				await prisma.recipe.update({
					where: { id: recipe.id },
					data: { totalCost }
				});
				return { ...recipe, totalCost };
			}
		}
		return recipe;
	}));
	
	res.json(recipesWithCosts);
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
	const { name, ingredients, servingSize, instructions } = req.body as { 
		name: string; 
		ingredients: Array<{ productId: string; amount: number }>;
		servingSize?: number;
		instructions?: string;
	};
	if (!name) {
		return res.status(400).json({ message: 'Nome é obrigatório' });
	}

	// Calcular custo total
	let totalCost = 0;
	if (ingredients && ingredients.length > 0) {
		const products = await prisma.product.findMany({
			where: { id: { in: ingredients.map(i => i.productId) } }
		});
		
		for (const ing of ingredients) {
			const product = products.find(p => p.id === ing.productId);
			if (product?.pricePerGram) {
				totalCost += ing.amount * product.pricePerGram;
			}
		}
	}

	const created = await prisma.recipe.create({
		data: {
			name,
			totalCost,
			servingSize: servingSize ?? 1,
			instructions,
			ingredients: {
				create: (ingredients ?? []).map((i) => ({ productId: i.productId, amount: i.amount })),
			},
		},
		include: { ingredients: { include: { product: true } } },
	});
	return res.status(201).json(created);
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
	const { id } = req.params;
	const { name, ingredients, servingSize, instructions } = req.body as { 
		name?: string; 
		ingredients?: Array<{ productId: string; amount: number }>;
		servingSize?: number;
		instructions?: string;
	};
	try {
		const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			// Calcular custo se ingredientes foram atualizados
			let totalCost = undefined;
			if (ingredients) {
				totalCost = 0;
				const products = await tx.product.findMany({
					where: { id: { in: ingredients.map(i => i.productId) } }
				});
				
				for (const ing of ingredients) {
					const product = products.find(p => p.id === ing.productId);
					if (product?.pricePerGram) {
						totalCost += ing.amount * product.pricePerGram;
					}
				}
			}

			const updateData: Partial<Prisma.RecipeUpdateInput> = {};
			if (name !== undefined) updateData.name = name;
			if (totalCost !== undefined) updateData.totalCost = totalCost;
			if (servingSize !== undefined) updateData.servingSize = servingSize;
			if (instructions !== undefined) updateData.instructions = instructions;

			const recipe = await tx.recipe.update({ where: { id }, data: updateData });
			
			if (ingredients) {
				await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
				await tx.recipeIngredient.createMany({
					data: ingredients.map((i) => ({ recipeId: id as string, productId: i.productId, amount: i.amount })),
				});
			}
			return tx.recipe.findUnique({ where: { id }, include: { ingredients: { include: { product: true } } } });
		});
		res.json(updated);
	} catch {
		res.status(404).json({ message: 'Receita não encontrada' });
	}
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		// Deletar receita (os ingredientes serão deletados automaticamente via CASCADE)
		await prisma.recipe.delete({ where: { id } });
		return res.status(204).send();
	} catch (err: unknown) {
		console.error('Erro ao deletar receita:', err);
		if ((err as Prisma.PrismaClientKnownRequestError)?.code === 'P2025') {
			return res.status(404).json({ message: 'Receita não encontrada' });
		}
		return res.status(500).json({ message: 'Erro ao deletar receita' });
	}
});

router.post('/:id/prepare', requireAuth, async (req: Request, res: Response) => {
	const { id } = req.params;
	const qty = Number((req.query.qty as string) ?? '1');
	if (!Number.isFinite(qty) || qty <= 0) {
		return res.status(400).json({ message: 'Quantidade inválida' });
	}

		try {
		const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const recipe = await tx.recipe.findUnique({ where: { id }, include: { ingredients: { include: { product: true } } } });
			if (!recipe) {
				throw new Error('NOT_FOUND');
			}

			// Verificar estoque e coletar informações sobre ingredientes insuficientes
			const insufficientItems: Array<{ productName: string; needed: number; available: number }> = [];
			
			for (const ing of recipe.ingredients) {
				const product = await tx.product.findUnique({ where: { id: ing.productId } });
				if (!product) throw new Error('PRODUCT_MISSING');
				const needed = ing.amount * qty;
				if (product.quantity < needed) {
					insufficientItems.push({
						productName: product.name,
						needed,
						available: product.quantity
					});
				}
			}

			if (insufficientItems.length > 0) {
				const error = new Error('INSUFFICIENT_STOCK') as Error & { insufficientItems: Array<{ productName: string; needed: number; available: number }> };
				error.insufficientItems = insufficientItems;
				throw error;
			}

			for (const ing of recipe.ingredients) {
				const needed = ing.amount * qty;
				await tx.product.update({
					where: { id: ing.productId },
					data: { quantity: { decrement: needed } },
				});
				await tx.consumption.create({
					data: {
						productId: ing.productId,
						amount: needed,
						reason: `prepare:${recipe.name}`,
					},
				});
			}

			return { prepared: qty };
		});
		return res.json({ success: true, data: result });
	} catch (err: unknown) {
		if ((err as Error)?.message === 'NOT_FOUND') {
			return res.status(404).json({ success: false, message: 'Receita não encontrada' });
		}
		if ((err as Error)?.message === 'PRODUCT_MISSING') {
			return res.status(400).json({ success: false, message: 'Produto não encontrado' });
		}
		if ((err as Error)?.message === 'INSUFFICIENT_STOCK') {
			return res.status(400).json({ 
				success: false, 
				message: 'Estoque insuficiente',
				insufficientItems: (err as Error & { insufficientItems: Array<{ productName: string; needed: number; available: number }> })?.insufficientItems || []
			});
		}
		console.error('Erro ao preparar receita:', err);
		return res.status(500).json({ success: false, message: 'Erro ao preparar receita' });
	}
});

router.post('/:id/scale', requireAuth, async (req: Request, res: Response) => {
	const { id } = req.params;
	const { multiplier } = req.body as { multiplier: number };
	
	if (!multiplier || multiplier <= 0) {
		return res.status(400).json({ success: false, message: 'Multiplicador deve ser maior que zero' });
	}

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { id },
			include: { ingredients: { include: { product: true } } }
		});

		if (!recipe) {
			return res.status(404).json({ success: false, message: 'Receita não encontrada' });
		}

		const scaledIngredients = recipe.ingredients.map(ing => ({
			productId: ing.productId,
			amount: ing.amount * multiplier,
			productName: ing.product.name
		}));

		// Recalcular custo
		let totalCost = 0;
		for (const ing of recipe.ingredients) {
			if (ing.product?.pricePerGram) {
				totalCost += ing.amount * multiplier * ing.product.pricePerGram;
			}
		}

		res.json({
			success: true,
			data: {
				recipeName: recipe.name,
				multiplier,
				originalServingSize: recipe.servingSize || 1,
				newServingSize: Math.round((recipe.servingSize || 1) * multiplier),
				ingredients: scaledIngredients,
				originalCost: recipe.totalCost || 0,
				newCost: totalCost,
				costPerServing: recipe.servingSize ? totalCost / (recipe.servingSize * multiplier) : totalCost
			}
		});
		return;
	} catch (error) {
		console.error('Erro ao escalar receita:', error);
		return res.status(500).json({ success: false, message: 'Erro ao escalar receita' });
	}
}); 