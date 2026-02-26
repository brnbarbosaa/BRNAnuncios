const jwt = require('jsonwebtoken');
const { createLog } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware de autenticação JWT.
 * Injeta req.user = { id, name, email, role }
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
        createLog({
            action: 'AUTH_FAILED',
            details: { reason: err.message, path: req.path },
            ip,
            level: 'warning',
        });
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

module.exports = { authMiddleware };
