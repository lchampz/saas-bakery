import rateLimit from 'express-rate-limit';
import { Request } from 'express';


const getIp = (req: Request): string => {
	const ip = req.ip || (req.socket?.remoteAddress) || 'unknown';
	return ip.replace(/^::ffff:/, '').split(':')[0] || ip;
};


export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 5, // máximo 5 tentativas por IP
	message: {
		message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
	},
	keyGenerator: (req) => getIp(req),
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		const ip = getIp(req);
		return ip === 'unknown';
	},
});


export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // máximo 100 requests por IP
	message: {
		message: 'Muitas requisições. Tente novamente em 15 minutos.'
	},
	keyGenerator: (req) => getIp(req),
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		const ip = getIp(req);
		return ip === 'unknown';
	},
});
