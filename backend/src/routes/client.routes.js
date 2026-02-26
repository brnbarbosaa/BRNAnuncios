const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadLogo, uploadGallery } = require('../middleware/upload.middleware');
const { deleteFile, deleteBusinessFolder, UPLOADS_ROOT } = require('../utils/fileManager');
const { createLog } = require('../utils/logger');
const path = require('path');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
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
        const [images] = await db.execute('SELECT * FROM business_images WHERE business_id = ? ORDER BY sort_order ASC', [business.id]);
        const [hours] = await db.execute('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week ASC', [business.id]);

        return res.json({ business, images, hours });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar dados do negócio.' });
    }
});

// PUT /api/client/business — atualiza dados do negócio
router.put('/business', async (req, res) => {
    try {
        const [biz] = await db.execute('SELECT id FROM businesses WHERE user_id = ? LIMIT 1', [req.user.id]);
        if (!biz[0]) return res.status(404).json({ error: 'Negócio não encontrado.' });
        const businessId = biz[0].id;

        const {
            name, category_id, short_description, description,
            phone, whatsapp, email, website, instagram, facebook,
            street, number, complement, neighborhood, city, state, zip_code, tags,
        } = req.body;

        const slugify = require('slugify');
        const slug = slugify(name, { lower: true, strict: true });

        await db.execute(
            `UPDATE businesses SET
        name=?, slug=?, category_id=?, short_description=?, description=?,
        phone=?, whatsapp=?, email=?, website=?, instagram=?, facebook=?,
        street=?, number=?, complement=?, neighborhood=?, city=?, state=?, zip_code=?, tags=?,
        updated_at=NOW()
       WHERE id=? AND user_id=?`,
            [
                name, slug, category_id || null, short_description || null, description || null,
                phone || null, whatsapp || null, email || null, website || null, instagram || null, facebook || null,
                street || null, number || null, complement || null, neighborhood || null,
                city || null, state || null, zip_code || null, tags || null,
                businessId, req.user.id,
            ]
        );

        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_BUSINESS', entity: 'business', entityId: businessId, ip: getIp(req), level: 'info' });
        return res.json({ message: 'Dados atualizados com sucesso.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um negócio com este nome.' });
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

// POST /api/client/business/gallery/:businessId — upload de galeria
router.post('/business/gallery/:businessId', uploadGallery, async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const [biz] = await db.execute('SELECT id FROM businesses WHERE id = ? AND user_id = ? LIMIT 1', [businessId, req.user.id]);
        if (!biz[0]) return res.status(403).json({ error: 'Acesso negado.' });
        if (!req.files?.length) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

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

// PUT /api/client/profile — atualiza perfil
router.put('/profile', async (req, res) => {
    const { name, phone, currentPassword, newPassword } = req.body;
    try {
        if (newPassword) {
            const bcrypt = require('bcryptjs');
            const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
            const valid = await bcrypt.compare(currentPassword || '', rows[0].password_hash);
            if (!valid) return res.status(400).json({ error: 'Senha atual incorreta.' });
            const hash = await bcrypt.hash(newPassword, 12);
            await db.execute('UPDATE users SET name=?, phone=?, password_hash=? WHERE id=?', [name, phone || null, hash, req.user.id]);
        } else {
            await db.execute('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone || null, req.user.id]);
        }
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_PROFILE', entity: 'user', entityId: req.user.id, ip: getIp(req), level: 'info' });
        return res.json({ message: 'Perfil atualizado.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
});

module.exports = router;
