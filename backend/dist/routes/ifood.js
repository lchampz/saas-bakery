import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
const router = Router();
const prisma = new PrismaClient();
// Configurar integração com iFood
router.post('/integration/configure', requireAuth, async (req, res, next) => {
    try {
        const { merchantId, clientId, clientSecret, webhookUrl, isActive } = req.body;
        // Validar dados obrigatórios
        if (!merchantId || !clientId || !clientSecret || !webhookUrl) {
            throw new CustomError('Dados obrigatórios não fornecidos', 400);
        }
        // Aqui você salvaria a configuração no banco de dados
        // Por enquanto, vamos simular uma resposta de sucesso
        const config = {
            merchantId,
            clientId,
            clientSecret: '***', // Não retornar o secret completo
            webhookUrl,
            isActive: isActive || true,
            createdAt: new Date(),
        };
        res.json({
            success: true,
            message: 'Integração configurada com sucesso',
            data: config
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter configuração atual
router.get('/integration/config', requireAuth, async (req, res, next) => {
    try {
        // Simular configuração existente
        const config = {
            merchantId: 'MERCHANT_123',
            clientId: 'CLIENT_456',
            clientSecret: '***',
            webhookUrl: 'https://fratelli.com/webhook/ifood',
            isActive: true,
            createdAt: new Date(),
        };
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        next(error);
    }
});
// Sincronizar catálogo de produtos
router.post('/catalog/sync', requireAuth, async (req, res, next) => {
    try {
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            throw new CustomError('Lista de produtos é obrigatória', 400);
        }
        // Aqui você sincronizaria os produtos com o iFood
        // Por enquanto, vamos simular uma resposta de sucesso
        const syncedProducts = products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            available: product.available,
            syncedAt: new Date(),
        }));
        res.json({
            success: true,
            message: `${products.length} produtos sincronizados com sucesso`,
            data: { products: syncedProducts }
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter pedidos do iFood
router.get('/orders', requireAuth, async (req, res, next) => {
    try {
        const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;
        // Simular pedidos do iFood
        const mockOrders = [
            {
                id: 'ORDER_001',
                shortId: '001',
                displayId: '001',
                orderType: 'DELIVERY',
                status: 'PLACED',
                createdAt: new Date().toISOString(),
                customer: {
                    id: 'CUST_001',
                    name: 'Maria Silva',
                    phoneNumber: '+5511999999999',
                    email: 'maria@email.com'
                },
                delivery: {
                    address: {
                        street: 'Rua das Flores',
                        number: '123',
                        neighborhood: 'Centro',
                        city: 'São Paulo',
                        state: 'SP',
                        zipCode: '01234-567'
                    },
                    deliveryFee: 5.00,
                    deliveryMethod: 'DELIVERY'
                },
                items: [
                    {
                        id: 'ITEM_001',
                        name: 'Bolo de Chocolate',
                        quantity: 1,
                        unitPrice: 45.00,
                        totalPrice: 45.00,
                        category: 'Bolos'
                    },
                    {
                        id: 'ITEM_002',
                        name: 'Cupcake de Baunilha',
                        quantity: 6,
                        unitPrice: 8.00,
                        totalPrice: 48.00,
                        category: 'Cupcakes'
                    }
                ],
                total: {
                    itemsTotal: 93.00,
                    deliveryFee: 5.00,
                    benefits: 0,
                    orderTotal: 98.00,
                    additionalFees: 0
                },
                payments: [
                    {
                        id: 'PAY_001',
                        method: 'PIX',
                        type: 'ONLINE',
                        value: 98.00,
                        status: 'PAID'
                    }
                ]
            },
            {
                id: 'ORDER_002',
                shortId: '002',
                displayId: '002',
                orderType: 'TAKEOUT',
                status: 'CONFIRMED',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                customer: {
                    id: 'CUST_002',
                    name: 'João Santos',
                    phoneNumber: '+5511888888888',
                    email: 'joao@email.com'
                },
                delivery: {
                    address: {
                        street: 'Av. Paulista',
                        number: '1000',
                        neighborhood: 'Bela Vista',
                        city: 'São Paulo',
                        state: 'SP',
                        zipCode: '01310-100'
                    },
                    deliveryFee: 0,
                    deliveryMethod: 'TAKEOUT'
                },
                items: [
                    {
                        id: 'ITEM_003',
                        name: 'Torta de Morango',
                        quantity: 1,
                        unitPrice: 35.00,
                        totalPrice: 35.00,
                        category: 'Tortas'
                    }
                ],
                total: {
                    itemsTotal: 35.00,
                    deliveryFee: 0,
                    benefits: 0,
                    orderTotal: 35.00,
                    additionalFees: 0
                },
                payments: [
                    {
                        id: 'PAY_002',
                        method: 'CREDIT_CARD',
                        type: 'ONLINE',
                        value: 35.00,
                        status: 'PAID'
                    }
                ]
            }
        ];
        // Filtrar por status se especificado
        let filteredOrders = mockOrders;
        if (status) {
            filteredOrders = mockOrders.filter(order => order.status === status);
        }
        // Aplicar paginação
        const paginatedOrders = filteredOrders.slice(Number(offset), Number(offset) + Number(limit));
        res.json({
            success: true,
            data: {
                orders: paginatedOrders,
                total: filteredOrders.length,
                limit: Number(limit),
                offset: Number(offset)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter pedido específico
router.get('/orders/:orderId', requireAuth, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        // Simular busca de pedido específico
        const mockOrder = {
            id: orderId,
            shortId: '001',
            displayId: '001',
            orderType: 'DELIVERY',
            status: 'PLACED',
            createdAt: new Date().toISOString(),
            customer: {
                id: 'CUST_001',
                name: 'Maria Silva',
                phoneNumber: '+5511999999999',
                email: 'maria@email.com'
            },
            delivery: {
                address: {
                    street: 'Rua das Flores',
                    number: '123',
                    neighborhood: 'Centro',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01234-567'
                },
                deliveryFee: 5.00,
                deliveryMethod: 'DELIVERY'
            },
            items: [
                {
                    id: 'ITEM_001',
                    name: 'Bolo de Chocolate',
                    quantity: 1,
                    unitPrice: 45.00,
                    totalPrice: 45.00,
                    category: 'Bolos'
                }
            ],
            total: {
                itemsTotal: 45.00,
                deliveryFee: 5.00,
                benefits: 0,
                orderTotal: 50.00,
                additionalFees: 0
            },
            payments: [
                {
                    id: 'PAY_001',
                    method: 'PIX',
                    type: 'ONLINE',
                    value: 50.00,
                    status: 'PAID'
                }
            ]
        };
        res.json({
            success: true,
            data: mockOrder
        });
    }
    catch (error) {
        next(error);
    }
});
// Confirmar pedido
router.post('/orders/:orderId/confirm', requireAuth, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { estimatedTime } = req.body;
        // Aqui você confirmaria o pedido com o iFood
        // Por enquanto, vamos simular uma resposta de sucesso
        res.json({
            success: true,
            message: 'Pedido confirmado com sucesso',
            data: {
                orderId,
                status: 'CONFIRMED',
                estimatedTime: estimatedTime || 30,
                confirmedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Cancelar pedido
router.post('/orders/:orderId/cancel', requireAuth, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        if (!reason) {
            throw new CustomError('Motivo do cancelamento é obrigatório', 400);
        }
        // Aqui você cancelaria o pedido com o iFood
        res.json({
            success: true,
            message: 'Pedido cancelado com sucesso',
            data: {
                orderId,
                status: 'CANCELLED',
                reason,
                cancelledAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Despachar pedido
router.post('/orders/:orderId/dispatch', requireAuth, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        // Aqui você marcaria o pedido como despachado no iFood
        res.json({
            success: true,
            message: 'Pedido despachado com sucesso',
            data: {
                orderId,
                status: 'DISPATCHED',
                dispatchedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter resumo de vendas
router.get('/analytics/sales-summary', requireAuth, async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        // Simular dados de analytics
        const mockSummary = {
            totalOrders: 165,
            totalRevenue: 13200.00,
            averageOrderValue: 80.00,
            ordersByStatus: {
                'PLACED': 5,
                'CONFIRMED': 12,
                'DISPATCHED': 8,
                'DELIVERED': 140,
                'CANCELLED': 0
            },
            period: {
                startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: endDate || new Date().toISOString(),
                groupBy
            }
        };
        res.json({
            success: true,
            data: mockSummary
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter produtos mais vendidos
router.get('/analytics/top-products', requireAuth, async (req, res, next) => {
    try {
        const { startDate, endDate, limit = 10 } = req.query;
        // Simular produtos mais vendidos
        const mockTopProducts = [
            { name: 'Bolo de Chocolate', quantity: 45, revenue: 2250.00 },
            { name: 'Cupcake de Baunilha', quantity: 38, revenue: 1900.00 },
            { name: 'Torta de Morango', quantity: 32, revenue: 1600.00 },
            { name: 'Brigadeiro Gourmet', quantity: 28, revenue: 1400.00 },
            { name: 'Pão de Mel', quantity: 25, revenue: 1250.00 },
            { name: 'Brownie de Chocolate', quantity: 22, revenue: 1100.00 },
            { name: 'Torta de Limão', quantity: 18, revenue: 900.00 },
            { name: 'Cupcake de Chocolate', quantity: 15, revenue: 750.00 }
        ];
        const limitedProducts = mockTopProducts.slice(0, Number(limit));
        res.json({
            success: true,
            data: limitedProducts
        });
    }
    catch (error) {
        next(error);
    }
});
// Testar webhook
router.post('/webhook/test', requireAuth, async (req, res, next) => {
    try {
        // Aqui você testaria a conectividade do webhook
        res.json({
            success: true,
            message: 'Webhook testado com sucesso',
            data: {
                status: 'OK',
                timestamp: new Date().toISOString(),
                responseTime: '150ms'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Obter status da integração
router.get('/integration/status', requireAuth, async (req, res, next) => {
    try {
        // Simular status da integração
        res.json({
            success: true,
            data: {
                isActive: true,
                lastSync: new Date().toISOString(),
                totalOrders: 165,
                status: 'connected'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Webhook para receber eventos do iFood
router.post('/webhook', async (req, res, next) => {
    try {
        const { eventType, orderId, merchantId, timestamp, data } = req.body;
        console.log('Webhook iFood recebido:', {
            eventType,
            orderId,
            merchantId,
            timestamp
        });
        // Aqui você processaria o evento do iFood
        // Por exemplo, salvar o pedido no banco de dados, enviar notificações, etc.
        res.json({
            success: true,
            message: 'Webhook processado com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
