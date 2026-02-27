const router = require('express').Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const { uploadLogo, uploadGallery } = require('../middleware/upload.middleware');
const { deleteFile, deleteBusinessFolder } = require('../utils/fileManager');
const { createLog } = require('../utils/logger');

router.use(authMiddleware, roleMiddleware('admin'));

function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

// ═══════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════
router.get('/dashboard', async (req, res) => {
    try {
        const [[{ total_businesses }]] = await db.execute("SELECT COUNT(*) AS total_businesses FROM businesses");
        const [[{ active_businesses }]] = await db.execute("SELECT COUNT(*) AS active_businesses FROM businesses WHERE status='active'");
        const [[{ total_users }]] = await db.execute("SELECT COUNT(*) AS total_users FROM users WHERE role='client'");
        const [[{ pending_requests }]] = await db.execute("SELECT COUNT(*) AS pending_requests FROM requests WHERE status='pending'");
        const [[{ total_views }]] = await db.execute("SELECT COALESCE(SUM(views),0) AS total_views FROM businesses");

        const [recent_logs] = await db.execute(
            "SELECT id, user_name, action, entity, level, created_at FROM system_logs ORDER BY created_at DESC LIMIT 10"
        );

        return res.json({ total_businesses, active_businesses, total_users, pending_requests, total_views, recent_logs });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
    }
});

// ═══════════════════════════════════════
//  USUÁRIOS
// ═══════════════════════════════════════
router.get('/users', async (req, res) => {
    try {
        const { q, role, page = 1 } = req.query;
        const limit = 20, offset = (parseInt(page) - 1) * limit;
        let where = '1=1'; const params = [];
        if (q) { where += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
        if (role) { where += ' AND u.role = ?'; params.push(role); }

        const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`, params);
        const [users] = await db.execute(
            `SELECT u.id, u.name, u.email, u.role, u.active, u.last_login, u.created_at,
              b.id AS business_id, b.name AS business_name, b.status AS business_status
       FROM users u LEFT JOIN businesses b ON b.user_id = u.id
       WHERE ${where} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        return res.json({ users, pagination: { total, page: parseInt(page), limit, pages: Math.ceil(total / limit) } });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

router.post('/users', async (req, res) => {
    const { name, email, password, role = 'client', phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    try {
        const hash = await bcrypt.hash(password, 12);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?,?,?,?,?)',
            [name, email.toLowerCase(), hash, role, phone || null]
        );
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'CREATE_USER', entity: 'user', entityId: result.insertId, details: { email, role }, ip: getIp(req), level: 'success' });
        return res.status(201).json({ message: 'Usuário criado.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'E-mail já cadastrado.' });
        return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

router.put('/users/:id', async (req, res) => {
    const { name, email, role, phone, active, password } = req.body;
    try {
        const fields = ['name=?', 'email=?', 'role=?', 'phone=?', 'active=?'];
        const vals = [name, email, role, phone || null, active ? 1 : 0];
        if (password) { fields.push('password_hash=?'); vals.push(await bcrypt.hash(password, 12)); }
        vals.push(req.params.id);
        await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, vals);
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_USER', entity: 'user', entityId: parseInt(req.params.id), ip: getIp(req), level: 'info' });
        return res.json({ message: 'Usuário atualizado.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Não é possível excluir o próprio usuário.' });
        // Busca negócios vinculados para limpar arquivos
        const [businesses] = await db.execute('SELECT id FROM businesses WHERE user_id = ?', [req.params.id]);
        for (const b of businesses) deleteBusinessFolder(b.id);
        await db.execute('DELETE FROM users WHERE id=?', [req.params.id]);
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'DELETE_USER', entity: 'user', entityId: parseInt(req.params.id), ip: getIp(req), level: 'warning' });
        return res.json({ message: 'Usuário excluído.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// ═══════════════════════════════════════
//  NEGÓCIOS
// ═══════════════════════════════════════
router.get('/businesses', async (req, res) => {
    try {
        const { q, status, category, page = 1 } = req.query;
        const limit = 20, offset = (parseInt(page) - 1) * limit;
        let where = '1=1'; const params = [];
        if (q) { where += ' AND (b.name LIKE ? OR b.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
        if (status) { where += ' AND b.status = ?'; params.push(status); }
        if (category) { where += ' AND cat.slug = ?'; params.push(category); }

        const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM businesses b LEFT JOIN categories cat ON cat.id = b.category_id WHERE ${where}`, params);
        const [businesses] = await db.execute(
            `SELECT b.id, b.name, b.slug, b.logo, b.status, b.plan, b.views, b.featured, b.created_at,
              cat.name AS category_name, u.name AS owner_name, u.email AS owner_email
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE ${where} ORDER BY b.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        return res.json({ businesses, pagination: { total, page: parseInt(page), limit, pages: Math.ceil(total / limit) } });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao listar negócios.' });
    }
});

router.get('/businesses/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT b.*, cat.name AS category_name, u.name AS owner_name, u.email AS owner_email
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Negócio não encontrado.' });
        const [images] = await db.execute('SELECT * FROM business_images WHERE business_id = ? ORDER BY sort_order ASC', [req.params.id]);
        const [hours] = await db.execute('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week ASC', [req.params.id]);
        return res.json({ business: rows[0], images, hours });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar negócio.' });
    }
});

router.post('/businesses', async (req, res) => {
    try {
        const { name, user_id, category_id, short_description, description, phone, whatsapp, email,
            website, instagram, facebook, street, number, complement, neighborhood, city, state, zip_code, tags, status, plan } = req.body;
        if (!name || !user_id) return res.status(400).json({ error: 'Nome e usuário são obrigatórios.' });
        const slug = slugify(name, { lower: true, strict: true });
        const [result] = await db.execute(
            `INSERT INTO businesses (user_id, category_id, name, slug, short_description, description,
        phone, whatsapp, email, website, instagram, facebook,
        street, number, complement, neighborhood, city, state, zip_code, tags, status, plan)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [user_id, category_id || null, name, slug, short_description || null, description || null,
                phone || null, whatsapp || null, email || null, website || null, instagram || null, facebook || null,
                street || null, number || null, complement || null, neighborhood || null, city || null,
                state || null, zip_code || null, tags || null, status || 'active', plan || 'free']
        );
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'CREATE_BUSINESS', entity: 'business', entityId: result.insertId, ip: getIp(req), level: 'success' });
        return res.status(201).json({ message: 'Negócio criado.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um negócio com este nome.' });
        return res.status(500).json({ error: 'Erro ao criar negócio.' });
    }
});

router.put('/businesses/:id', async (req, res) => {
    try {
        const { name, category_id, short_description, description, phone, whatsapp, email,
            website, instagram, facebook, street, number, complement, neighborhood, city, state, zip_code,
            tags, status, plan, featured } = req.body;
        const slug = slugify(name, { lower: true, strict: true });
        await db.execute(
            `UPDATE businesses SET name=?, slug=?, category_id=?, short_description=?, description=?,
        phone=?, whatsapp=?, email=?, website=?, instagram=?, facebook=?,
        street=?, number=?, complement=?, neighborhood=?, city=?, state=?, zip_code=?,
        tags=?, status=?, plan=?, featured=?, updated_at=NOW()
       WHERE id=?`,
            [name, slug, category_id || null, short_description || null, description || null,
                phone || null, whatsapp || null, email || null, website || null, instagram || null, facebook || null,
                street || null, number || null, complement || null, neighborhood || null, city || null,
                state || null, zip_code || null, tags || null, status, plan || 'free', featured ? 1 : 0, req.params.id]
        );
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_BUSINESS', entity: 'business', entityId: parseInt(req.params.id), ip: getIp(req), level: 'info' });
        return res.json({ message: 'Negócio atualizado.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar negócio.' });
    }
});

router.delete('/businesses/:id', async (req, res) => {
    try {
        deleteBusinessFolder(req.params.id);
        await db.execute('DELETE FROM businesses WHERE id=?', [req.params.id]);
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'DELETE_BUSINESS', entity: 'business', entityId: parseInt(req.params.id), ip: getIp(req), level: 'warning' });
        return res.json({ message: 'Negócio excluído.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao excluir negócio.' });
    }
});

// Upload de logo pelo admin
router.post('/businesses/:id/logo', (req, res, next) => { req.params.businessId = req.params.id; next(); }, uploadLogo, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        const [biz] = await db.execute('SELECT logo FROM businesses WHERE id = ?', [req.params.id]);
        if (biz[0]?.logo) deleteFile(biz[0].logo);
        const relativePath = `/uploads/${req.params.id}/${req.file.filename}`;
        await db.execute('UPDATE businesses SET logo=?, updated_at=NOW() WHERE id=?', [relativePath, req.params.id]);
        return res.json({ message: 'Logo atualizado.', logo: relativePath });
    } catch (err) {
        return res.status(500).json({ error: 'Erro no upload do logo.' });
    }
});

// ═══════════════════════════════════════
//  REQUISIÇÕES DE CADASTRO
// ═══════════════════════════════════════
router.get('/requests', async (req, res) => {
    try {
        const { status, page = 1 } = req.query;
        const limit = 20, offset = (parseInt(page) - 1) * limit;
        let where = '1=1'; const params = [];
        if (status) { where += ' AND status = ?'; params.push(status); }
        const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM requests WHERE ${where}`, params);
        const [requests] = await db.execute(
            `SELECT r.*, cat.name AS category_name FROM requests r
       LEFT JOIN categories cat ON cat.id = r.category_id
       WHERE ${where} ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        return res.json({ requests, pagination: { total, page: parseInt(page), limit, pages: Math.ceil(total / limit) } });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar requisições.' });
    }
});

// PUT /api/admin/requests/:id/approve
router.put('/requests/:id/approve', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM requests WHERE id = ? LIMIT 1', [req.params.id]);
        const request = rows[0];
        if (!request) return res.status(404).json({ error: 'Requisição não encontrada.' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Essa requisição já foi processada.' });

        const { password = `Brn${Math.random().toString(36).slice(2, 8)}!` } = req.body;
        const hash = await bcrypt.hash(password, 12);

        // Cria usuário
        const [userResult] = await db.execute(
            'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?,?,?,?,?)',
            [request.contact_name, request.contact_email, hash, 'client', request.contact_phone || null]
        );
        const userId = userResult.insertId;

        // Cria negócio
        const slug = slugify(request.business_name, { lower: true, strict: true });
        const [bizResult] = await db.execute(
            `INSERT INTO businesses (user_id, category_id, name, slug, short_description, description,
        phone, whatsapp, website, instagram, facebook,
        street, number, complement, neighborhood, city, state, zip_code, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [userId, request.category_id || null, request.business_name, slug,
                request.short_description || null, request.description || null,
                request.phone || null, request.whatsapp || null, request.website || null,
                request.instagram || null, request.facebook || null,
                request.street || null, request.number || null, request.complement || null,
                request.neighborhood || null, request.city || null, request.state || null,
                request.zip_code || null, 'active']
        );

        await db.execute(
            'UPDATE requests SET status=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?',
            ['approved', req.user.id, request.id]
        );

        await createLog({
            userId: req.user.id, userName: req.user.name, action: 'APPROVE_REQUEST',
            entity: 'request', entityId: request.id,
            details: { contact_email: request.contact_email, business_id: bizResult.insertId },
            ip: getIp(req), level: 'success',
        });

        return res.json({
            message: 'Requisição aprovada! Usuário e negócio criados.',
            user_id: userId, business_id: bizResult.insertId,
            credentials: { email: request.contact_email, password },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        return res.status(500).json({ error: 'Erro ao aprovar requisição.' });
    }
});

router.put('/requests/:id/reject', async (req, res) => {
    try {
        const { admin_notes } = req.body;
        await db.execute(
            'UPDATE requests SET status=?, admin_notes=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?',
            ['rejected', admin_notes || null, req.user.id, req.params.id]
        );
        await createLog({ userId: req.user.id, userName: req.user.name, action: 'REJECT_REQUEST', entity: 'request', entityId: parseInt(req.params.id), details: { notes: admin_notes }, ip: getIp(req), level: 'warning' });
        return res.json({ message: 'Requisição rejeitada.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao rejeitar requisição.' });
    }
});

// ═══════════════════════════════════════
//  CATEGORIAS
// ═══════════════════════════════════════
router.get('/categories', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
    return res.json(rows);
});

router.post('/categories', async (req, res) => {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório.' });
    const slug = slugify(name, { lower: true, strict: true });
    try {
        const [r] = await db.execute('INSERT INTO categories (name, slug, icon, color) VALUES (?,?,?,?)', [name, slug, icon || null, color || '#6366f1']);
        return res.status(201).json({ message: 'Categoria criada.', id: r.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Categoria já existe.' });
        return res.status(500).json({ error: 'Erro ao criar categoria.' });
    }
});

router.put('/categories/:id', async (req, res) => {
    const { name, icon, color, active } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await db.execute('UPDATE categories SET name=?, slug=?, icon=?, color=?, active=? WHERE id=?', [name, slug, icon || null, color || '#6366f1', active ? 1 : 0, req.params.id]);
    return res.json({ message: 'Categoria atualizada.' });
});

router.delete('/categories/:id', async (req, res) => {
    await db.execute('UPDATE businesses SET category_id = NULL WHERE category_id = ?', [req.params.id]);
    await db.execute('DELETE FROM categories WHERE id=?', [req.params.id]);
    return res.json({ message: 'Categoria excluída.' });
});

// ═══════════════════════════════════════
//  DESTAQUES
// ═══════════════════════════════════════
router.get('/highlights', async (req, res) => {
    const [rows] = await db.execute(
        `SELECT h.*, b.name AS business_name, b.logo FROM highlights h
     JOIN businesses b ON b.id = h.business_id ORDER BY h.type, h.sort_order ASC`
    );
    return res.json(rows);
});

router.post('/highlights', async (req, res) => {
    const { business_id, type, title, subtitle, banner_image, sort_order, active, starts_at, ends_at } = req.body;
    if (!business_id) return res.status(400).json({ error: 'Negócio obrigatório.' });
    const [r] = await db.execute(
        'INSERT INTO highlights (business_id, type, title, subtitle, banner_image, sort_order, active, starts_at, ends_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [business_id, type || 'card', title || null, subtitle || null, banner_image || null, sort_order || 0, active !== false ? 1 : 0, starts_at || null, ends_at || null]
    );
    await db.execute('UPDATE businesses SET featured = 1 WHERE id = ?', [business_id]);
    return res.status(201).json({ message: 'Destaque criado.', id: r.insertId });
});

router.put('/highlights/:id', async (req, res) => {
    const { type, title, subtitle, banner_image, sort_order, active, starts_at, ends_at } = req.body;
    await db.execute(
        'UPDATE highlights SET type=?, title=?, subtitle=?, banner_image=?, sort_order=?, active=?, starts_at=?, ends_at=? WHERE id=?',
        [type, title || null, subtitle || null, banner_image || null, sort_order || 0, active ? 1 : 0, starts_at || null, ends_at || null, req.params.id]
    );
    return res.json({ message: 'Destaque atualizado.' });
});

router.delete('/highlights/:id', async (req, res) => {
    const [h] = await db.execute('SELECT business_id FROM highlights WHERE id = ?', [req.params.id]);
    await db.execute('DELETE FROM highlights WHERE id=?', [req.params.id]);
    if (h[0]) {
        const [[{ cnt }]] = await db.execute('SELECT COUNT(*) AS cnt FROM highlights WHERE business_id = ?', [h[0].business_id]);
        if (cnt === 0) await db.execute('UPDATE businesses SET featured = 0 WHERE id = ?', [h[0].business_id]);
    }
    return res.json({ message: 'Destaque removido.' });
});

// ═══════════════════════════════════════
//  PLANOS
// ═══════════════════════════════════════
router.get('/plans', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM plans ORDER BY sort_order ASC');
    return res.json(rows);
});

router.post('/plans', async (req, res) => {
    const { name, slug, description, price, price_promo, features, highlight, active, sort_order, contact_link } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Nome e slug são obrigatórios.' });
    try {
        const [r] = await db.execute(
            'INSERT INTO plans (name, slug, description, price, price_promo, features, highlight, active, sort_order, contact_link) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [name, slug, description || null, parseFloat(price) || 0, price_promo ? parseFloat(price_promo) : null,
                JSON.stringify(features || []), highlight ? 1 : 0, active !== false ? 1 : 0, parseInt(sort_order) || 0, contact_link || null]
        );
        return res.status(201).json({ message: 'Plano criado.', id: r.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug já existe.' });
        return res.status(500).json({ error: 'Erro ao criar plano.' });
    }
});

router.put('/plans/:id', async (req, res) => {
    const { name, slug, description, price, price_promo, features, highlight, active, sort_order, contact_link } = req.body;
    try {
        await db.execute(
            'UPDATE plans SET name=?, slug=?, description=?, price=?, price_promo=?, features=?, highlight=?, active=?, sort_order=?, contact_link=?, updated_at=NOW() WHERE id=?',
            [name, slug, description || null, parseFloat(price) || 0, price_promo ? parseFloat(price_promo) : null,
                JSON.stringify(features || []), highlight ? 1 : 0, active !== false ? 1 : 0, parseInt(sort_order) || 0, contact_link || null, req.params.id]
        );
        return res.json({ message: 'Plano atualizado.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
});

router.delete('/plans/:id', async (req, res) => {
    await db.execute('DELETE FROM plans WHERE id=?', [req.params.id]);
    return res.json({ message: 'Plano excluído.' });
});

// ═══════════════════════════════════════
//  CONFIGURAÇÕES DO SISTEMA
// ═══════════════════════════════════════
router.get('/settings', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM settings ORDER BY `key` ASC');
    return res.json(rows);
});

router.put('/settings', async (req, res) => {
    const { settings } = req.body; // [{key, value}]
    for (const s of settings) {
        await db.execute("INSERT INTO settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?", [s.key, s.value, s.value]);
    }
    await createLog({ userId: req.user.id, userName: req.user.name, action: 'UPDATE_SETTINGS', ip: getIp(req), level: 'info' });
    return res.json({ message: 'Configurações salvas.' });
});

module.exports = router;
