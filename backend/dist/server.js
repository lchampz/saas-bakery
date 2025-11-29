import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable is required');
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}
import { router as authRouter } from './routes/auth.js';
import { router as productsRouter } from './routes/products.js';
import { router as recipesRouter } from './routes/recipes.js';
import { router as reportsRouter } from './routes/reports.js';
import { router as suppliersRouter } from './routes/suppliers.js';
import { router as purchasesRouter } from './routes/purchases.js';
import { router as exportsRouter } from './routes/exports.js';
import { router as backupRouter } from './routes/backup.js';
import { router as aiRecipesRouter } from './routes/ai-recipes.js';
import ifoodRouter from './routes/ifood.js';
// import { requestLogger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
// import { apiLimiter } from './middleware/rateLimiter.js';
const app = express();
// Trust proxy (necessário para Azure App Service e rate limiting)
app.set('trust proxy', 1);
// Security middleware - CORS configurado para aceitar múltiplas origens
const allowedOrigins = [
    'http://localhost:5173', // Desenvolvimento local
    'https://confeitec.vercel.app', // Produção Vercel
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []), // URL customizada se configurada
];
// Permitir também subdomínios da Vercel (preview deployments)
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requisições sem origin (ex: Postman, mobile apps)
        if (!origin) {
            return callback(null, true);
        }
        // Verificar se a origem está na lista permitida
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Permitir subdomínios da Vercel (ex: confeitec-*.vercel.app)
        if (origin.includes('.vercel.app')) {
            return callback(null, true);
        }
        // Bloquear outras origens
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));
// Rate limiting
// app.use(apiLimiter);
// Logging
// app.use(requestLogger);
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Timeout para requisições longas (especialmente IA)
app.use((req, res, next) => {
    // Aumentar timeout para rotas de IA
    if (req.path.startsWith('/ai-recipes')) {
        req.setTimeout(180000); // 3 minutos
        res.setTimeout(180000);
    }
    else {
        req.setTimeout(30000); // 30 segundos para outras rotas
        res.setTimeout(30000);
    }
    next();
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Ignorar requisições de bots (robots.txt, favicon, etc)
app.get('/robots.txt', (_req, res) => {
    res.status(404).end();
});
app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
});
// Routes
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/recipes', recipesRouter);
app.use('/reports', reportsRouter);
app.use('/suppliers', suppliersRouter);
app.use('/purchases', purchasesRouter);
app.use('/exports', exportsRouter);
app.use('/backup', backupRouter);
app.use('/ai-recipes', aiRecipesRouter);
app.use('/ifood', ifoodRouter);
// Error handling middleware (must be last)
app.use(notFound);
// app.use(errorLogger);
app.use(errorHandler);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
// Export app for testing
export { app };
// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 API running at http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
