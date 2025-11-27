import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const router = Router();

router.get('/stock', requireAuth, async (_req: Request, res: Response) => {
	const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
	res.json(products);
});

router.get('/capability', requireAuth, async (_req: Request, res: Response) => {
	const recipes = await prisma.recipe.findMany({ include: { ingredients: true } });
	const products = await prisma.product.findMany();
	const quantityByProduct: Record<string, number> = Object.fromEntries(
		products.map((p: { id: string; quantity: number }) => [p.id, p.quantity])
	);
	const capability = recipes.map((r: { id: string; name: string; ingredients: { productId: string; amount: number }[] }) => {
		let max = Infinity as number;
		for (const ing of r.ingredients) {
			const available = quantityByProduct[ing.productId] ?? 0;
			const possible = Math.floor(available / ing.amount);
			max = Math.min(max, Number.isFinite(possible) ? possible : 0);
		}
		return { recipeId: r.id, name: r.name, possible: Number.isFinite(max) ? max : 0 };
	});
	res.json(capability);
});

router.get('/history', requireAuth, async (_req: Request, res: Response) => {
	const history = await prisma.consumption.findMany({
		orderBy: { createdAt: 'desc' },
		include: { product: true },
	});
	res.json(history);
});

router.get('/low-stock', requireAuth, async (_req: Request, res: Response) => {
	try {
		const products = await prisma.product.findMany({
			where: { deletedAt: null }
		});

		const lowStockProducts = products.filter(p => {
			const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
			return p.quantity < minLevel;
		}).map(p => {
			const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
			const percentage = (p.quantity / minLevel) * 100;
			const status = percentage < 30 ? 'critical' : percentage < 60 ? 'warning' : 'low';
			
			return {
				id: p.id,
				name: p.name,
				currentQuantity: p.quantity,
				minLevel,
				unit: p.unit,
				percentage: Math.round(percentage),
				status,
				needed: Math.max(minLevel - p.quantity, 0)
			};
		});

		res.json({
			success: true,
			data: {
				products: lowStockProducts,
				critical: lowStockProducts.filter(p => p.status === 'critical').length,
				warning: lowStockProducts.filter(p => p.status === 'warning').length,
				low: lowStockProducts.filter(p => p.status === 'low').length,
				total: lowStockProducts.length
			}
		});
	} catch (error) {
		console.error('Erro ao buscar estoque baixo:', error);
		res.status(500).json({ success: false, message: 'Erro ao buscar estoque baixo' });
	}
});

router.get('/profitability', requireAuth, async (_req: Request, res: Response) => {
	try {
		const recipes = await prisma.recipe.findMany({
			where: { deletedAt: null },
			include: {
				ingredients: {
					include: { product: true }
				}
			}
		});

		const profitability = recipes.map(recipe => {
			// Calcular custo total
			let totalCost = recipe.totalCost || 0;
			if (totalCost === 0) {
				for (const ing of recipe.ingredients) {
					if (ing.product?.pricePerGram) {
						totalCost += ing.amount * ing.product.pricePerGram;
					}
				}
			}

			// Estimar receita (custo * 2.5 = margem de 60%)
			const estimatedRevenue = totalCost * 2.5;
			const profit = estimatedRevenue - totalCost;
			const profitMargin = totalCost > 0 ? (profit / estimatedRevenue) * 100 : 0;
			const costPerServing = recipe.servingSize ? totalCost / recipe.servingSize : totalCost;

			// Contar preparações
			const preparations = recipe.ingredients.length > 0 
				? Math.floor(
					Math.min(...recipe.ingredients.map(ing => {
						const product = ing.product;
						if (!product) return 0;
						return product.quantity / ing.amount;
					}))
				)
				: 0;

			return {
				recipeId: recipe.id,
				recipeName: recipe.name,
				totalCost,
				estimatedRevenue,
				profit,
				profitMargin: Math.round(profitMargin),
				costPerServing: Math.round(costPerServing * 100) / 100,
				servingSize: recipe.servingSize || 1,
				possiblePreparations: Math.max(0, preparations),
				ingredientsCount: recipe.ingredients.length
			};
		}).sort((a, b) => b.profitMargin - a.profitMargin);

		const totalCost = profitability.reduce((sum, r) => sum + r.totalCost, 0);
		const totalRevenue = profitability.reduce((sum, r) => sum + r.estimatedRevenue, 0);
		const totalProfit = totalRevenue - totalCost;
		const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

		res.json({
			success: true,
			data: {
				recipes: profitability,
				summary: {
					totalRecipes: profitability.length,
					totalCost,
					totalRevenue,
					totalProfit,
					overallMargin: Math.round(overallMargin),
					avgProfitMargin: Math.round(profitability.reduce((sum, r) => sum + r.profitMargin, 0) / profitability.length) || 0
				}
			}
		});
	} catch (error) {
		console.error('Erro ao calcular rentabilidade:', error);
		res.status(500).json({ success: false, message: 'Erro ao calcular rentabilidade' });
	}
});

router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
	try {
		const { days = '30' } = req.query;
		const daysNum = parseInt(days as string, 10);
		
		if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
			return res.status(400).json({ success: false, message: 'Período inválido' });
		}

		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - daysNum);

		// Buscar produtos e receitas
		const [products, recipes, consumptions] = await Promise.all([
			prisma.product.findMany({
				where: { deletedAt: null },
				include: { consumptions: {
					where: {
						createdAt: { gte: startDate, lte: endDate }
					}
				}}
			}),
			prisma.recipe.findMany({
				where: { deletedAt: null },
				include: { ingredients: { include: { product: true } } }
			}),
			prisma.consumption.findMany({
				where: {
					createdAt: { gte: startDate, lte: endDate }
				},
				include: { product: true },
				orderBy: { createdAt: 'asc' }
			})
		]);

		// Calcular dados de vendas (baseado em consumptions de receitas)
		const recipeConsumptions = consumptions.filter(c => c.reason.startsWith('prepare:'));
		const salesByDate: Record<string, { revenue: number; orders: number; products: number }> = {};
		
		recipeConsumptions.forEach(consumption => {
			const date = consumption.createdAt.toISOString().split('T')[0];
			if (!date) return;
			
			if (!salesByDate[date]) {
				salesByDate[date] = { revenue: 0, orders: 0, products: 0 };
			}
			// Estimativa de receita baseada no preço do produto
			const product = products.find(p => p.id === consumption.productId);
			if (product?.pricePerGram && salesByDate[date]) {
				salesByDate[date].revenue += consumption.amount * product.pricePerGram;
			}
			if (salesByDate[date]) {
				salesByDate[date].products += 1;
			}
		});

		// Contar pedidos (agrupar por receita preparada no mesmo dia)
		Object.keys(salesByDate).forEach(date => {
			if (!date) return;
			const dateConsumptions = recipeConsumptions.filter(c => 
				c.createdAt.toISOString().split('T')[0] === date
			);
			const uniqueRecipes = new Set(dateConsumptions.map(c => c.reason));
			if (salesByDate[date]) {
				salesByDate[date].orders = uniqueRecipes.size;
			}
		});

		const salesData = Object.entries(salesByDate).map(([date, data]) => ({
			date,
			revenue: data.revenue,
			orders: data.orders,
			products: data.products
		})).sort((a, b) => a.date.localeCompare(b.date));

		// Dados de inventário
		const inventoryData = products.map(p => {
			const isUnit = p.unit === 'un';
			const minLevel = isUnit ? 1 : 100;
			const status = isUnit 
				? (p.quantity < 1 ? 'critical' : p.quantity < 5 ? 'warning' : 'ok')
				: (p.quantity < minLevel ? 'critical' : p.quantity < minLevel * 2 ? 'warning' : 'ok');
			
			return {
				name: p.name,
				quantity: p.quantity,
				minLevel,
				status
			};
		});

		// Performance de receitas (baseado em preparações)
		const recipePerformance = recipes.map(recipe => {
			const preparations = recipeConsumptions.filter(c => c.reason === `prepare:${recipe.name}`);
			const popularity = preparations.length;
			
			// Calcular margem de lucro estimada
			let totalCost = 0;
			recipe.ingredients.forEach(ing => {
				const product = products.find(p => p.id === ing.productId);
				if (product?.pricePerGram) {
					totalCost += ing.amount * product.pricePerGram;
				}
			});
			// Estimativa: receita = custo * 2.5 (margem de 60%)
			const estimatedRevenue = totalCost * 2.5;
			const profitMargin = totalCost > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;

			return {
				name: recipe.name,
				popularity: Math.min(popularity * 10, 100), // Normalizar para 0-100
				profitMargin: Math.round(profitMargin)
			};
		}).filter(r => r.popularity > 0).sort((a, b) => b.popularity - a.popularity).slice(0, 5);

		// Análise de custos (baseado em consumptions)
		const totalCost = consumptions.reduce((sum, c) => {
			const product = products.find(p => p.id === c.productId);
			return sum + (product?.pricePerGram ? c.amount * product.pricePerGram : 0);
		}, 0);

		const costAnalysis = [
			{ category: 'Ingredientes', amount: totalCost, percentage: 100 }
		];

		res.json({
			success: true,
			data: {
				salesData,
				inventoryData,
				recipePerformance,
				costAnalysis,
				totalRevenue: salesData.reduce((sum, d) => sum + d.revenue, 0),
				totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
				totalProducts: products.length
			}
		});
		return;
	} catch (error) {
		console.error('Erro ao buscar analytics:', error);
		res.status(500).json({ success: false, message: 'Erro ao buscar analytics' });
		return;
	}
}); 