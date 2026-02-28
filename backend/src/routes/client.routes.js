const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadLogo, uploadGallery } = require('../middleware/upload.middleware');
const { deleteFile, deleteBusinessFolder, UPLOADS_ROOT } = require('../utils/fileManager');
const { createLog } = require('../utils/logger');
const { planHasFeature, getPlanLimits, PLAN_FEATURES } = require('../utils/planFeatures');
const path = require('path');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

// Helper: busca negócio do cliente autenticado
async function getClientBusiness(userId) {
    const [rows] = await db.execute('SELECT * FROM businesses WHERE user_id = ? LIMIT 1', [userId]);
    return rows[0] || null;
}

// GET /api/client/business — dados do negócio do cliente autenticado
router.get('/business', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT b.*, cat.name AS category_name
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE b.user_id = ? LIMIT 1`,
            [req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Nenhum negócio encontrado para este usuário.' });

        const business = rows[0];
        // Parse social_links
        if (business.social_links && typeof business.social_links === 'string') {
            try { business.social_links = JSON.parse(business.social_links); } catch { business.social_links = []; }
        }

        const [images] = await db.execute('SELECT * FROM business_images WHERE business_id = ? ORDER BY sort_order ASC', [business.id]);
        const [hours] = await db.execute('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week ASC', [business.id]);

        // Envia features do plano para o frontend
        const plan = business.plan || 'free';
        const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
        const limits = getPlanLimits(plan);

        return res.json({ business, images, hours, planFeatures: features, planLimits: limits });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar dados do negócio.' });
    }
});

// PUT /api/client/business — atualiza dados do negócio (com validação de plano)
router.put('/business', async (req, res) => {
    try {
        const biz = await getClientBusiness(req.user.id);
        if (!biz) return res.status(404).json({ error: 'Negócio não encontrado.' });
        const businessId = biz.id;
        const plan = biz.plan || 'free';

        const {
            name, category_id, category_observation, short_description, description,
            phone, whatsapp, email, website, instagram, facebook,
            street, number, complement, neighborhood, city, state, zip_code, tags,
            social_links,
        } = req.body;

        const slugify = require('slugify');
        const slug = slugify(name, { lower: true, strict: true });

        // Validações por plano
        const finalDescription = planHasFeature(plan, 'description') ? (description || null) : biz.description;
        const finalTags = planHasFeature(plan, 'tags') ? (tags || null) : biz.tags;
        const finalStreet = planHasFeature(plan, 'address_map') ? (street || null) : biz.street;
        const finalNumber = planHasFeature(plan, 'address_map') ? (number || null) : biz.number;
        const finalComplement = planHasFeature(plan, 'address_map') ? (complement || null) : biz.complement;
        const finalNeighborhood = planHasFeature(plan, 'address_map') ? (neighborhood || null) : biz.neighborhood;
        const finalCity = planHasFeature(plan, 'address_map') ? (city || null) : biz.city;
        const finalState = planHasFeature(plan, 'address_map') ? (state || null) : biz.state;
        const finalZip = planHasFeature(plan, 'address_map') ? (zip_code || null) : biz.zip_code;

        // Social links (validar limite)
        let finalSocialLinks = biz.social_links;
        if (planHasFeature(plan, 'social_links') && social_links !== undefined) {
            const links = Array.isArray(social_links) ? social_links : [];
            const limit = getPlanLimits(plan).social_links;
            finalSocialLinks = JSON.stringify(links.slice(0, limit));
        }

        // Bloquear alteração de categoria se o negócio já estiver ativo/aprovado
        let finalCategoryId = biz.category_id;
        if (biz.status === 'pending') {
            finalCategoryId = category_id || null;
        }

        await db.execute(
            `UPDATE businesses SET
        name=?, slug=?, category_id=?, category_observation=?, short_description=?, description=?,
        phone=?, whatsapp=?, email=?, website=?, instagram=?, facebook=?,
        street=?, number=?, complement=?, neighborhood=?, city=?, state=?, zip_code=?, tags=?,
        social_links=?,
        updated_at=NOW()
       WHERE id=? AND user_id=?`,
            [
                name, slug, finalCategoryId, category_observation || null, short_description || null, finalDescription,
                phone || null, whatsapp || null, email || null, website || null, instagram || null, facebook || null,
                finalStreet, finalNumber, finalComplement, finalNeighborhood, finalCity,
                finalState, finalZip, finalTags,
                finalSocialLinks,
                businessId, req.user.id,
            ]
        );

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_BUSINESS', entity: 'business', entityId: businessId, ip: getIp(req), level: 'info' });
        return res.json({ message: 'Dados atualizados com sucesso.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um negócio com este nome.' });
        console.error('[Client] Update business:', err);
        return res.status(500).json({ error: 'Erro ao atualizar dados.' });
    }
});

// POST /api/client/business/logo/:businessId — upload do logo
router.post('/business/logo/:businessId', uploadLogo, async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const [biz] = await db.execute('SELECT id, logo FROM businesses WHERE id = ? AND user_id = ? LIMIT 1', [businessId, req.user.id]);
        if (!biz[0]) return res.status(403).json({ error: 'Acesso negado.' });
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

        // Remove logo antiga se diferente
        const oldLogo = biz[0].logo;
        if (oldLogo && oldLogo !== req.file.path) deleteFile(oldLogo);

        const relativePath = `/uploads/${businessId}/${req.file.filename}`;
        await db.execute('UPDATE businesses SET logo = ?, updated_at = NOW() WHERE id = ?', [relativePath, businessId]);

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_LOGO', entity: 'business', entityId: parseInt(businessId), details: { file: req.file.filename }, ip: getIp(req), level: 'success' });
        return res.json({ message: 'Logo atualizado.', logo: relativePath });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao fazer upload do logo.' });
    }
});

// POST /api/client/business/gallery/:businessId — upload de galeria (PREMIUM only)
router.post('/business/gallery/:businessId', uploadGallery, async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const [biz] = await db.execute('SELECT id, plan FROM businesses WHERE id = ? AND user_id = ? LIMIT 1', [businessId, req.user.id]);
        if (!biz[0]) return res.status(403).json({ error: 'Acesso negado.' });

        const plan = biz[0].plan || 'free';
        if (!planHasFeature(plan, 'gallery')) {
            return res.status(403).json({ error: 'A galeria de fotos está disponível no plano Premium. Faça upgrade para desbloquear!' });
        }

        if (!req.files?.length) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

        // Verifica limite de fotos
        const limit = getPlanLimits(plan).gallery_photos;
        const [[{ currentCount }]] = await db.execute('SELECT COUNT(*) AS currentCount FROM business_images WHERE business_id = ?', [businessId]);
        if (currentCount + req.files.length > limit) {
            return res.status(400).json({ error: `Limite de ${limit} fotos atingido. Remova algumas antes de adicionar novas.` });
        }

        const insertValues = req.files.map(f => {
            const relPath = `/uploads/${businessId}/gallery/${f.filename}`;
            return [parseInt(businessId), f.filename, relPath, null, 0];
        });

        for (const val of insertValues) {
            await db.execute('INSERT INTO business_images (business_id, filename, path, caption, sort_order) VALUES (?,?,?,?,?)', val);
        }

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPLOAD_GALLERY', entity: 'business', entityId: parseInt(businessId), details: { count: req.files.length }, ip: getIp(req), level: 'success' });
        return res.status(201).json({ message: `${req.files.length} imagem(ns) adicionada(s).` });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao fazer upload da galeria.' });
    }
});

// DELETE /api/client/business/gallery/:imageId — remove imagem da galeria
router.delete('/business/gallery/:imageId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT bi.* FROM business_images bi
       JOIN businesses b ON b.id = bi.business_id
       WHERE bi.id = ? AND b.user_id = ? LIMIT 1`,
            [req.params.imageId, req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Imagem não encontrada.' });

        deleteFile(rows[0].path);
        await db.execute('DELETE FROM business_images WHERE id = ?', [req.params.imageId]);

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'DELETE_IMAGE', entity: 'business_image', entityId: parseInt(req.params.imageId), ip: getIp(req), level: 'info' });
        return res.json({ message: 'Imagem removida com sucesso.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao remover imagem.' });
    }
});

// PUT /api/client/business/hours/:businessId — atualiza horários
router.put('/business/hours/:businessId', async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const [biz] = await db.execute('SELECT id FROM businesses WHERE id = ? AND user_id = ? LIMIT 1', [businessId, req.user.id]);
        if (!biz[0]) return res.status(403).json({ error: 'Acesso negado.' });

        const { hours } = req.body; // Array: [{day_of_week, open_time, close_time, closed}]
        if (!Array.isArray(hours)) return res.status(400).json({ error: 'Formato inválido.' });

        await db.execute('DELETE FROM business_hours WHERE business_id = ?', [businessId]);
        for (const h of hours) {
            await db.execute(
                'INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, closed) VALUES (?,?,?,?,?)',
                [businessId, h.day_of_week, h.open_time || null, h.close_time || null, h.closed ? 1 : 0]
            );
        }

        return res.json({ message: 'Horários atualizados com sucesso.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar horários.' });
    }
});

// GET /api/client/profile — perfil do cliente
router.get('/profile', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, email, phone, avatar FROM users WHERE id = ?', [req.user.id]);
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
});

// PUT /api/client/profile — atualiza perfil (telefone)
router.put('/profile', async (req, res) => {
    const { phone } = req.body;
    try {
        const [existing] = await db.execute('SELECT name FROM users WHERE id = ? LIMIT 1', [req.user.id]);
        const currentName = existing[0]?.name || req.user.name;
        await db.execute('UPDATE users SET name=?, phone=? WHERE id=?', [currentName, phone || null, req.user.id]);
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_PROFILE', entity: 'user', entityId: req.user.id, ip: getIp(req), level: 'info' });
        return res.json({ message: 'Telefone atualizado.' });
    } catch (err) {
        console.error('[Profile]', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
});

// PUT /api/client/profile/password — altera senha
router.put('/profile/password', async (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Campos obrigatórios.' });
    if (new_password.length < 6) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    try {
        const bcrypt = require('bcryptjs');
        const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const valid = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!valid) return res.status(400).json({ error: 'Senha atual incorreta.' });
        const hash = await bcrypt.hash(new_password, 12);
        await db.execute('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'CHANGE_PASSWORD', entity: 'user', entityId: req.user.id, ip: getIp(req), level: 'warning' });
        return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
        console.error('[Password]', err);
        return res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
});

// GET /api/client/stats — estatísticas do negócio do cliente (PREMIUM only)
router.get('/stats', async (req, res) => {
    try {
        const [biz] = await db.execute(
            `SELECT b.id, b.name, b.views, b.featured, b.plan, b.status, b.created_at
             FROM businesses b WHERE b.user_id = ? LIMIT 1`,
            [req.user.id]
        );
        if (!biz[0]) return res.status(404).json({ error: 'Negócio não encontrado.' });

        const plan = biz[0].plan || 'free';
        if (!planHasFeature(plan, 'statistics')) {
            return res.json({
                locked: true,
                plan,
                message: 'Estatísticas disponíveis no plano Premium.',
                totalViews: biz[0].views || 0,
                status: biz[0].status,
            });
        }

        const businessId = biz[0].id;
        const totalViews = biz[0].views || 0;

        let viewsByDay = [];
        try {
            const [logRows] = await db.execute(
                `SELECT DATE(CONVERT_TZ(created_at, '+00:00', '-03:00')) AS day,
                        COUNT(*) AS views
                 FROM logs
                 WHERE action = 'VIEW_BUSINESS' AND entity_id = ?
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                 GROUP BY day
                 ORDER BY day ASC`,
                [businessId]
            );
            viewsByDay = logRows;
        } catch (e) { /* tabela logs sem dados */ }

        const [[{ photoCount }]] = await db.execute(
            'SELECT COUNT(*) AS photoCount FROM business_images WHERE business_id = ?', [businessId]
        );

        const [[{ highlightCount }]] = await db.execute(
            `SELECT COUNT(*) AS highlightCount FROM highlights
             WHERE business_id = ? AND active = 1 AND status = 'approved'
               AND (ends_at IS NULL OR ends_at > DATE_SUB(NOW(), INTERVAL 3 HOUR))`,
            [businessId]
        );

        return res.json({
            totalViews,
            viewsByDay,
            photoCount,
            highlightCount,
            plan: biz[0].plan,
            status: biz[0].status,
            featured: !!biz[0].featured,
            memberSince: biz[0].created_at,
        });
    } catch (err) {
        console.error('[Client stats]', err);
        return res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
    }
});

// ═══════════════════════════════════════
//  DESTAQUE NO CARROSSEL
// ═══════════════════════════════════════

// GET /api/client/highlight — status do destaque do cliente
router.get('/highlight', async (req, res) => {
    try {
        const biz = await getClientBusiness(req.user.id);
        if (!biz) return res.status(404).json({ error: 'Negócio não encontrado.' });

        const plan = biz.plan || 'free';
        const canRequest = planHasFeature(plan, 'highlight_request');

        const [highlights] = await db.execute(
            `SELECT id, type, title, subtitle, status, active, starts_at, ends_at, admin_notes, requested_at, reviewed_at
             FROM highlights WHERE business_id = ? ORDER BY created_at DESC`,
            [biz.id]
        );

        return res.json({
            canRequest,
            plan,
            business: { id: biz.id, name: biz.name, logo: biz.logo, short_description: biz.short_description },
            highlights,
        });
    } catch (err) {
        console.error('[Client highlight]', err);
        return res.status(500).json({ error: 'Erro ao carregar status do destaque.' });
    }
});

// POST /api/client/highlight — solicitar destaque no carrossel (PREMIUM only)
router.post('/highlight', async (req, res) => {
    try {
        const biz = await getClientBusiness(req.user.id);
        if (!biz) return res.status(404).json({ error: 'Negócio não encontrado.' });
        if (biz.status !== 'active') return res.status(400).json({ error: 'Seu negócio precisa estar ativo para solicitar destaque.' });

        const plan = biz.plan || 'free';
        if (!planHasFeature(plan, 'highlight_request')) {
            return res.status(403).json({ error: 'Solicitar destaque no carrossel está disponível no plano Premium. Faça upgrade!' });
        }

        // Verifica se já tem solicitação pendente ou ativa
        const [[{ pendingOrActive }]] = await db.execute(
            `SELECT COUNT(*) AS pendingOrActive FROM highlights
             WHERE business_id = ? AND (status = 'pending' OR (status = 'approved' AND active = 1 AND (ends_at IS NULL OR ends_at > NOW())))`,
            [biz.id]
        );
        if (pendingOrActive > 0) {
            return res.status(400).json({ error: 'Você já possui uma solicitação pendente ou destaque ativo.' });
        }

        const { title, subtitle } = req.body;

        await db.execute(
            `INSERT INTO highlights (business_id, type, title, subtitle, sort_order, active, status, requested_at)
             VALUES (?, 'carousel', ?, ?, 0, 0, 'pending', NOW())`,
            [biz.id, title || biz.name, subtitle || biz.short_description]
        );

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'REQUEST_HIGHLIGHT', entity: 'business', entityId: biz.id, ip: getIp(req), level: 'info' });
        return res.status(201).json({ message: 'Solicitação de destaque enviada! O administrador irá analisar em breve.' });
    } catch (err) {
        console.error('[Client highlight request]', err);
        return res.status(500).json({ error: 'Erro ao solicitar destaque.' });
    }
});

module.exports = router;
