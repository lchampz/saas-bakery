import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';

export const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const purchases = await prisma.purchase.findMany({
			orderBy: { purchaseDate: 'desc' },
			include: {
				supplier: true,
				items: {
					include: {
						product: true
					}
				}
			},
			take: 50
		});

		res.json({
			success: true,
			data: purchases
		});
	} catch (error) {
		next(error);
	}
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { supplierId, invoiceNumber, purchaseDate, notes, items } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return next(new CustomError('A compra deve ter pelo menos um item', 400));
		}

		const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			// Calcular total
			let totalAmount = 0;
			const purchaseItems = [];

			for (const item of items) {
				const { productId, quantity, unitPrice } = item;
				const totalPrice = quantity * unitPrice;
				totalAmount += totalPrice;

				purchaseItems.push({
					productId,
					quantity,
					unitPrice,
					totalPrice
				});
			}

			// Criar compra
			const purchase = await tx.purchase.create({
				data: {
					supplierId: supplierId || null,
					totalAmount,
					invoiceNumber,
					purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
					notes,
					items: {
						create: purchaseItems
					}
				},
				include: {
					supplier: true,
					items: {
						include: {
							product: true
						}
					}
				}
			});

			// Atualizar estoque dos produtos
			for (const item of items) {
				await tx.product.update({
					where: { id: item.productId },
					data: {
						quantity: { increment: item.quantity }
					}
				});
			}

			return purchase;
		});

		res.status(201).json({
			success: true,
			message: 'Compra registrada com sucesso',
			data: result
		});
	} catch (error) {
		next(error);
	}
});

router.get('/shopping-list', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const products = await prisma.product.findMany({
			where: { deletedAt: null },
			include: { supplier: true }
		});

		const shoppingList = products
			.filter(p => {
				const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
				return p.quantity < minLevel;
			})
			.map(p => {
				const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
				const suggestedQuantity = Math.max(minLevel * 2 - p.quantity, minLevel);
				
				return {
					productId: p.id,
					productName: p.name,
					currentQuantity: p.quantity,
					minLevel,
					suggestedQuantity,
					unit: p.unit,
					supplier: p.supplier ? {
						id: p.supplier.id,
						name: p.supplier.name,
						contact: p.supplier.contact,
						phone: p.supplier.phone
					} : null
				};
			});

		// Agrupar por fornecedor
		const groupedBySupplier = shoppingList.reduce((acc, item) => {
			const supplierKey = item.supplier?.id || 'sem-fornecedor';
			if (!acc[supplierKey]) {
				acc[supplierKey] = {
					supplier: item.supplier || { id: null, name: 'Sem Fornecedor' },
					items: []
				};
			}
			acc[supplierKey].items.push(item);
			return acc;
		}, {} as Record<string, { supplier: any; items: typeof shoppingList }>);

		res.json({
			success: true,
			data: {
				items: shoppingList,
				groupedBySupplier: Object.values(groupedBySupplier),
				totalItems: shoppingList.length
			}
		});
	} catch (error) {
		next(error);
	}
});

