import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';

export const router = Router();

router.post('/create', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Verificar se usuário é admin
		const userId = (req as any).user?.id;
		if (!userId) {
			return next(new CustomError('Não autorizado', 401));
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user?.role !== 'admin') {
			return next(new CustomError('Apenas administradores podem criar backups', 403));
		}

		// Criar backup dos dados principais
		const [products, recipes, suppliers, purchases] = await Promise.all([
			prisma.product.findMany({ where: { deletedAt: null } }),
			prisma.recipe.findMany({ 
				where: { deletedAt: null },
				include: { ingredients: { include: { product: true } } }
			}),
			prisma.supplier.findMany({ where: { deletedAt: null } }),
			prisma.purchase.findMany({
				include: {
					supplier: true,
					items: { include: { product: true } }
				},
				take: 100,
				orderBy: { purchaseDate: 'desc' }
			})
		]);

		const backup = {
			version: '1.0',
			createdAt: new Date().toISOString(),
			data: {
				products,
				recipes,
				suppliers,
				purchases
			}
		};

		res.json({
			success: true,
			message: 'Backup criado com sucesso',
			data: backup
		});
	} catch (error) {
		next(error);
	}
});

router.get('/download', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = (req as any).user?.id;
		if (!userId) {
			return next(new CustomError('Não autorizado', 401));
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user?.role !== 'admin') {
			return next(new CustomError('Apenas administradores podem baixar backups', 403));
		}

		const [products, recipes, suppliers, purchases] = await Promise.all([
			prisma.product.findMany({ where: { deletedAt: null } }),
			prisma.recipe.findMany({ 
				where: { deletedAt: null },
				include: { ingredients: { include: { product: true } } }
			}),
			prisma.supplier.findMany({ where: { deletedAt: null } }),
			prisma.purchase.findMany({
				include: {
					supplier: true,
					items: { include: { product: true } }
				},
				take: 100
			})
		]);

		const backup = {
			version: '1.0',
			createdAt: new Date().toISOString(),
			data: {
				products,
				recipes,
				suppliers,
				purchases
			}
		};

		const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
		res.json(backup);
	} catch (error) {
		next(error);
	}
});

