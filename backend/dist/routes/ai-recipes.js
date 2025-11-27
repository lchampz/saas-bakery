import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import { mcpClient } from '../lib/mcp.js';
export const router = Router();
// Integração MCP para criação de receitas via IA
router.post('/generate', requireAuth, async (req, res, next) => {
    try {
        const { description, availableProducts, servingSize, dietaryRestrictions } = req.body;
        if (!description || description.trim().length === 0) {
            return next(new CustomError('Descrição da receita é obrigatória', 400));
        }
        // Buscar produtos disponíveis no banco
        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
        // Se produtos específicos foram fornecidos, filtrar
        let filteredProducts = products;
        if (availableProducts && availableProducts.length > 0) {
            filteredProducts = products.filter(p => availableProducts.some(ap => p.name.toLowerCase().includes(ap.toLowerCase())));
        }
        // Preparar contexto para IA (MCP)
        const context = {
            description,
            availableProducts: filteredProducts.map(p => ({
                name: p.name,
                unit: p.unit,
                pricePerGram: p.pricePerGram ?? undefined
            })),
            servingSize: servingSize || 1,
            dietaryRestrictions: dietaryRestrictions || []
        };
        // Usar MCP para gerar receita
        const mcpContext = {
            description: context.description,
            availableProducts: context.availableProducts,
            servingSize: context.servingSize,
            dietaryRestrictions: context.dietaryRestrictions
        };
        let generatedRecipe;
        try {
            console.log('[AI-Recipes] Gerando receita com MCP...');
            generatedRecipe = await mcpClient.generateRecipe(mcpContext);
            console.log('[AI-Recipes] Receita gerada:', JSON.stringify(generatedRecipe, null, 2));
        }
        catch (error) {
            console.error('[AI-Recipes] Erro ao gerar receita com MCP:', error);
            return next(new CustomError(error instanceof Error ? error.message : 'Erro ao gerar receita com IA. Verifique se o Ollama está rodando e se o modelo está disponível.', 500));
        }
        try {
            // Mapear nomes de produtos para IDs
            console.log('[AI-Recipes] Mapeando ingredientes para produtos do banco...');
            console.log('[AI-Recipes] Produtos disponíveis:', filteredProducts.map(p => p.name));
            console.log('[AI-Recipes] Ingredientes gerados:', generatedRecipe.ingredients.map(i => i.productName));
            const ingredientsWithIds = await Promise.all(generatedRecipe.ingredients.map(async (ing) => {
                const product = filteredProducts.find(p => p.name.toLowerCase() === ing.productName.toLowerCase());
                if (!product) {
                    // Tentar encontrar produto similar
                    const similar = filteredProducts.find(p => p.name.toLowerCase().includes(ing.productName.toLowerCase()) ||
                        ing.productName.toLowerCase().includes(p.name.toLowerCase()));
                    if (similar) {
                        console.log(`[AI-Recipes] Produto "${ing.productName}" mapeado para "${similar.name}"`);
                        return {
                            productId: similar.id,
                            amount: ing.amount,
                            productName: similar.name,
                            unit: ing.unit || similar.unit
                        };
                    }
                    console.warn(`[AI-Recipes] Produto "${ing.productName}" não encontrado no banco`);
                    return null;
                }
                return {
                    productId: product.id,
                    amount: ing.amount,
                    productName: product.name,
                    unit: ing.unit || product.unit
                };
            }));
            const validIngredients = ingredientsWithIds.filter((ing) => ing !== null);
            console.log('[AI-Recipes] Ingredientes válidos mapeados:', validIngredients.length);
            if (validIngredients.length === 0) {
                console.warn('[AI-Recipes] Nenhum ingrediente válido encontrado. Retornando receita sem ingredientes mapeados.');
            }
            const responseData = {
                success: true,
                message: 'Receita gerada com sucesso',
                data: {
                    name: generatedRecipe.name,
                    ingredients: validIngredients,
                    instructions: generatedRecipe.instructions || 'Instruções não fornecidas',
                    estimatedCost: generatedRecipe.estimatedCost || 0,
                    servingSize: context.servingSize
                }
            };
            console.log('[AI-Recipes] Enviando resposta...');
            console.log('[AI-Recipes] Resposta (resumo):', {
                success: responseData.success,
                name: responseData.data.name,
                ingredientsCount: responseData.data.ingredients.length
            });
            // Garantir que a resposta seja enviada
            res.status(200).json(responseData);
            return;
        }
        catch (error) {
            console.error('[AI-Recipes] Erro ao mapear ingredientes ou enviar resposta:', error);
            return next(error);
        }
    }
    catch (error) {
        console.error('Erro ao gerar receita:', error);
        next(error);
    }
});
// Endpoint para criar receita diretamente a partir da geração
router.post('/create', requireAuth, async (req, res, next) => {
    try {
        const { name, ingredients, instructions, servingSize, estimatedCost } = req.body;
        if (!name || !ingredients || ingredients.length === 0) {
            return next(new CustomError('Nome e ingredientes são obrigatórios', 400));
        }
        // Calcular custo real
        let totalCost = estimatedCost || 0;
        if (totalCost === 0) {
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
        const recipe = await prisma.recipe.create({
            data: {
                name,
                totalCost,
                servingSize: servingSize || 1,
                instructions,
                ingredients: {
                    create: ingredients.map(i => ({
                        productId: i.productId,
                        amount: i.amount
                    }))
                }
            },
            include: {
                ingredients: {
                    include: { product: true }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Receita criada com sucesso',
            data: recipe
        });
    }
    catch (error) {
        next(error);
    }
});
