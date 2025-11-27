import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
export const router = Router();
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true, purchases: true }
                }
            }
        });
        res.json({
            success: true,
            data: suppliers
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                products: { where: { deletedAt: null } },
                purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 }
            }
        });
        if (!supplier || supplier.deletedAt) {
            return next(new CustomError('Fornecedor não encontrado', 404));
        }
        res.json({
            success: true,
            data: supplier
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { name, contact, email, phone, address } = req.body;
        if (!name || name.trim().length === 0) {
            return next(new CustomError('Nome é obrigatório', 400));
        }
        const supplier = await prisma.supplier.create({
            data: {
                name: name.trim(),
                contact,
                email,
                phone,
                address
            }
        });
        res.status(201).json({
            success: true,
            message: 'Fornecedor criado com sucesso',
            data: supplier
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, contact, email, phone, address } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: name?.trim(),
                contact,
                email,
                phone,
                address
            }
        });
        res.json({
            success: true,
            message: 'Fornecedor atualizado com sucesso',
            data: supplier
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return next(new CustomError('Fornecedor não encontrado', 404));
        }
        next(error);
    }
});
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.supplier.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        res.json({
            success: true,
            message: 'Fornecedor removido com sucesso'
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return next(new CustomError('Fornecedor não encontrado', 404));
        }
        next(error);
    }
});
