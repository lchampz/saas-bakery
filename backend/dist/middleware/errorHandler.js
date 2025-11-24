import { Prisma } from '@prisma/client';
export class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                error = new CustomError('Registro duplicado', 409);
                break;
            case 'P2025':
                error = new CustomError('Registro não encontrado', 404);
                break;
            default:
                error = new CustomError('Erro no banco de dados', 500);
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new CustomError('Token inválido', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new CustomError('Token expirado', 401);
    }
    // Validation errors
    if (err.name === 'ValidationError') {
        error = new CustomError('Dados inválidos', 400);
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
export const notFound = (req, res, next) => {
    const error = new CustomError(`Rota não encontrada: ${req.originalUrl}`, 404);
    next(error);
};
