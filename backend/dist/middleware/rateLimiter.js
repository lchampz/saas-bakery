import rateLimit from 'express-rate-limit';
// Função para extrair IP corretamente (remove porta se presente)
const getIp = (req) => {
    const ip = req.ip || (req.socket?.remoteAddress) || 'unknown';
    // Remove porta se presente (ex: "201.26.17.28:55964" -> "201.26.17.28")
    // Também remove "::ffff:" prefix se presente (IPv4 em IPv6)
    return ip.replace(/^::ffff:/, '').split(':')[0] || ip;
};
// Rate limiting para autenticação
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
        // Pular rate limit se IP não puder ser determinado
        const ip = getIp(req);
        return ip === 'unknown';
    },
});
// Rate limiting geral para API
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
        // Pular rate limit se IP não puder ser determinado
        const ip = getIp(req);
        return ip === 'unknown';
    },
});
