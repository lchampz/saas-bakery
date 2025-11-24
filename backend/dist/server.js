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
import ifoodRouter from './routes/ifood.js';
// import { requestLogger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
// import { apiLimiter } from './middleware/rateLimiter.js';
const app = express();
// Trust proxy (necessário para Azure App Service e rate limiting)
app.set('trust proxy', 1);
// Security middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
// Rate limiting
// app.use(apiLimiter);
// Logging
// app.use(requestLogger);
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
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
