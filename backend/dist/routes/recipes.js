import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export const router = Router();
router.get('/', requireAuth, async (_req, res) => {
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true }, orderBy: { name: 'asc' } });
    res.json(recipes);
});
router.post('/', requireAuth, async (req, res) => {
    const { name, ingredients } = req.body;
    if (!name)
        return res.status(400).json({ message: 'Nome é obrigatório' });
    const created = await prisma.recipe.create({
        data: {
            name,
            ingredients: {
                create: (ingredients ?? []).map((i) => ({ productId: i.productId, amount: i.amount })),
            },
        },
        include: { ingredients: true },
    });
    res.status(201).json(created);
});
router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, ingredients } = req.body;
    try {
        const updated = await prisma.$transaction(async (tx) => {
            const recipe = await tx.recipe.update({ where: { id }, data: { name } });
            if (ingredients) {
                await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
                await tx.recipeIngredient.createMany({
                    data: ingredients.map((i) => ({ recipeId: id, productId: i.productId, amount: i.amount })),
                });
            }
            return tx.recipe.findUnique({ where: { id }, include: { ingredients: true } });
        });
        res.json(updated);
    }
    catch {
        res.status(404).json({ message: 'Receita não encontrada' });
    }
});
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.recipe.delete({ where: { id } });
        res.status(204).send();
    }
    catch {
        res.status(404).json({ message: 'Receita não encontrada' });
    }
});
router.post('/:id/prepare', requireAuth, async (req, res) => {
    const { id } = req.params;
    const qty = Number(req.query.qty ?? '1');
    if (!Number.isFinite(qty) || qty <= 0)
        return res.status(400).json({ message: 'Quantidade inválida' });
    try {
        const result = await prisma.$transaction(async (tx) => {
            const recipe = await tx.recipe.findUnique({ where: { id }, include: { ingredients: true } });
            if (!recipe)
                throw new Error('NOT_FOUND');
            for (const ing of recipe.ingredients) {
                const product = await tx.product.findUnique({ where: { id: ing.productId } });
                if (!product)
                    throw new Error('PRODUCT_MISSING');
                const needed = ing.amount * qty;
                if (product.quantity < needed)
                    throw new Error('INSUFFICIENT_STOCK');
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
        res.json(result);
    }
    catch (err) {
        if (err?.message === 'NOT_FOUND')
            return res.status(404).json({ message: 'Receita não encontrada' });
        if (err?.message === 'INSUFFICIENT_STOCK')
            return res.status(400).json({ message: 'Estoque insuficiente' });
        return res.status(500).json({ message: 'Erro ao preparar receita' });
    }
});
