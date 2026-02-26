require('dotenv').config();

// Garante fuso horário de São Paulo em nível de processo
process.env.TZ = process.env.TZ || 'America/Sao_Paulo';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Segurança ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500,
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting específico para login (mais restritivo)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Uploads estáticos ────────────────────────────────────────────────────────
const UPLOADS_PATH = process.env.UPLOADS_PATH || '/app/uploads';
app.use('/uploads', express.static(UPLOADS_PATH));

// ─── Rotas da API ─────────────────────────────────────────────────────────────
app.use('/api/auth', loginLimiter, require('./src/routes/auth.routes'));
app.use('/api/public', require('./src/routes/public.routes'));
app.use('/api/client', require('./src/routes/client.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/admin/logs', require('./src/routes/logs.routes'));

// ─── Serve o frontend em produção ─────────────────────────────────────────────
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    app.get('*', (req, res) => {
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.json({ message: 'BRN Anúncios API — Backend OK', version: '1.0.0' }));
}

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack || err.message);
    res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
});

// ─── Inicialização ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 BRN Anúncios rodando na porta ${PORT}`);
    console.log(`📁 Uploads: ${UPLOADS_PATH}`);
    console.log(`⏰ Timezone: ${process.env.TZ}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'production'}\n`);
});

module.exports = app;
