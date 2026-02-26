const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createLog } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const ip = getIp(req);
    const ua = req.headers['user-agent'] || null;
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, password_hash, role, active FROM users WHERE email = ? LIMIT 1',
            [email.toLowerCase().trim()]
        );

        const user = rows[0];
        if (!user) {
            await createLog({ action: 'LOGIN_FAILED', details: { email, reason: 'Usuário não encontrado' }, ip, level: 'warning' });
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (!user.active) {
            await createLog({ action: 'LOGIN_BLOCKED', userId: user.id, userName: user.name, details: { reason: 'Conta desativada' }, ip, level: 'warning' });
            return res.status(403).json({ error: 'Conta desativada. Entre em contato com o administrador.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            await createLog({ action: 'LOGIN_FAILED', userId: user.id, userName: user.name, details: { reason: 'Senha incorreta' }, ip, level: 'warning' });
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Busca business vinculado ao cliente
        let businessId = null;
        if (user.role === 'client') {
            const [biz] = await db.execute('SELECT id FROM businesses WHERE user_id = ? LIMIT 1', [user.id]);
            businessId = biz[0]?.id || null;
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, businessId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        await createLog({
            userId: user.id, userName: user.name, action: 'LOGIN',
            details: { role: user.role }, ip, userAgent: ua, level: 'success',
        });

        return res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId },
        });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/auth/logout (apenas registra log)
router.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            await createLog({ userId: decoded.id, userName: decoded.name, action: 'LOGOUT', ip: getIp(req), level: 'info' });
        } catch (_) { }
    }
    return res.json({ message: 'Logout registrado.' });
});

// GET /api/auth/me — retorna dados do usuário autenticado
router.get('/me', require('../middleware/auth.middleware').authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, role, phone, avatar FROM users WHERE id = ?',
            [req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
