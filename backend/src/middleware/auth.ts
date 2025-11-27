import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { CustomError } from './errorHandler.js';

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		role?: string;
	};
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
	const auth = req.headers.authorization;
	
	if (!auth) {
		return next(new CustomError('Token de acesso ausente', 401));
	}
	
	const token = auth.replace('Bearer ', '');
	
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		
		// Buscar usuário para obter role
		const user = await prisma.user.findUnique({
			where: { id: decoded.sub },
			select: { id: true, email: true, role: true }
		});

		if (!user) {
			return next(new CustomError('Usuário não encontrado', 401));
		}

		req.user = {
			id: user.id,
			email: user.email,
			role: user.role
		};
		next();
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			return next(new CustomError('Token inválido', 401));
		}
		if (err instanceof jwt.TokenExpiredError) {
			return next(new CustomError('Token expirado', 401));
		}
		return next(new CustomError('Erro na autenticação', 401));
	}
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
	if (!req.user) {
		return next(new CustomError('Não autorizado', 401));
	}

	if (req.user.role !== 'admin') {
		return next(new CustomError('Acesso negado. Apenas administradores podem realizar esta ação.', 403));
	}

	next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
	const auth = req.headers.authorization;
	
	if (!auth) {
		return next();
	}
	
	const token = auth.replace('Bearer ', '');
	
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		req.user = {
			id: decoded.sub,
			email: decoded.email
		};
	} catch (err) {
		// Ignore auth errors for optional auth
	}
	
	next();
} 