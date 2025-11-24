import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { validateAuth, handleValidationErrors } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { CustomError } from '../middleware/errorHandler.js';
export const router = Router();
router.post('/register', authLimiter, validateAuth, handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return next(new CustomError('Usuário já existe', 409));
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, passwordHash },
            select: { id: true, email: true, createdAt: true }
        });
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: user
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', authLimiter, validateAuth, handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return next(new CustomError('Credenciais inválidas', 401));
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return next(new CustomError('Credenciais inválidas', 401));
        }
        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: { id: user.id, email: user.email }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) {
            return next(new CustomError('Token de acesso ausente', 401));
        }
        const token = auth.replace('Bearer ', '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, createdAt: true }
        });
        if (!user) {
            return next(new CustomError('Usuário não encontrado', 404));
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
});
