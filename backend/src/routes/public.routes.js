const router = require('express').Router();
const db = require('../config/db');

// GET /api/public/home — dados completos da home
router.get('/home', async (req, res) => {
    try {
        // Carrossel
        const [carousel] = await db.execute(
            `SELECT h.id, h.title, h.subtitle, h.banner_image,
              b.name, b.slug, b.short_description, b.logo, b.neighborhood
       FROM highlights h
       JOIN businesses b ON b.id = h.business_id
       WHERE h.type = 'carousel' AND h.active = 1
         AND (h.ends_at IS NULL OR h.ends_at > NOW())
       ORDER BY h.sort_order ASC LIMIT 10`
        );

        // Cards de destaque rotativos
        const [cards] = await db.execute(
            `SELECT h.id, h.title, h.subtitle,
              b.name, b.slug, b.short_description, b.logo,
              b.neighborhood, b.city, cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM highlights h
       JOIN businesses b ON b.id = h.business_id
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE h.type = 'card' AND h.active = 1
         AND (h.ends_at IS NULL OR h.ends_at > NOW())
       ORDER BY h.sort_order ASC LIMIT 20`
        );

        // Últimos 12 anúncios ativos
        const [latest] = await db.execute(
            `SELECT b.id, b.name, b.slug, b.short_description, b.logo,
              b.neighborhood, b.city, b.whatsapp, b.phone,
              cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE b.status = 'active'
       ORDER BY b.created_at DESC LIMIT 12`
        );

        // Configurações relevantes da home
        const [settings] = await db.execute(
            "SELECT `key`, `value` FROM settings WHERE `key` IN ('site_name','site_slogan','carousel_interval','highlight_cards_count')"
        );
        const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

        return res.json({ carousel, cards, latest, config });
    } catch (err) {
        console.error('[Public] Home error:', err);
        return res.status(500).json({ error: 'Erro ao carregar dados da home.' });
    }
});

// GET /api/public/businesses — listagem com paginação e filtros
router.get('/businesses', async (req, res) => {
    try {
        const { q, category, city, page = 1 } = req.query;
        const limit = 12;
        const offset = (parseInt(page) - 1) * limit;
        const params = [];

        let where = "b.status = 'active'";
        if (q) {
            where += ' AND MATCH(b.name, b.short_description, b.tags) AGAINST(? IN BOOLEAN MODE)';
            params.push(`${q}*`);
        }
        if (category) {
            where += ' AND cat.slug = ?';
            params.push(category);
        }
        if (city) {
            where += ' AND b.city LIKE ?';
            params.push(`%${city}%`);
        }

        const [total] = await db.execute(
            `SELECT COUNT(*) AS total FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id WHERE ${where}`,
            params
        );

        const [businesses] = await db.execute(
            `SELECT b.id, b.name, b.slug, b.short_description, b.logo, b.plan,
              b.neighborhood, b.city, b.phone, b.whatsapp, b.instagram,
              cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE ${where}
       ORDER BY b.featured DESC, b.plan DESC, b.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        return res.json({
            businesses,
            pagination: {
                total: total[0].total,
                page: parseInt(page),
                limit,
                pages: Math.ceil(total[0].total / limit),
            },
        });
    } catch (err) {
        console.error('[Public] Businesses error:', err);
        return res.status(500).json({ error: 'Erro ao listar anúncios.' });
    }
});

// GET /api/public/businesses/:slug — página individual do anúncio
router.get('/businesses/:slug', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT b.*, cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE b.slug = ? AND b.status = 'active' LIMIT 1`,
            [req.params.slug]
        );

        if (!rows[0]) return res.status(404).json({ error: 'Anúncio não encontrado.' });
        const business = rows[0];

        // Galeria
        const [images] = await db.execute(
            'SELECT id, path, caption, sort_order FROM business_images WHERE business_id = ? ORDER BY sort_order ASC',
            [business.id]
        );

        // Horários
        const [hours] = await db.execute(
            'SELECT day_of_week, open_time, close_time, closed FROM business_hours WHERE business_id = ? ORDER BY day_of_week ASC',
            [business.id]
        );

        // Incrementa views
        await db.execute('UPDATE businesses SET views = views + 1 WHERE id = ?', [business.id]);

        // Relacionados (mesma categoria)
        const [related] = await db.execute(
            `SELECT id, name, slug, short_description, logo, neighborhood
       FROM businesses WHERE category_id = ? AND status = 'active' AND id != ? LIMIT 4`,
            [business.category_id, business.id]
        );

        return res.json({ business, images, hours, related });
    } catch (err) {
        console.error('[Public] Business detail error:', err);
        return res.status(500).json({ error: 'Erro ao carregar anúncio.' });
    }
});

// GET /api/public/categories — todas as categorias ativas
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT c.id, c.name, c.slug, c.icon, c.color,
              COUNT(b.id) AS business_count
       FROM categories c
       LEFT JOIN businesses b ON b.category_id = c.id AND b.status = 'active'
       WHERE c.active = 1
       GROUP BY c.id ORDER BY c.name ASC`
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar categorias.' });
    }
});

// POST /api/public/requests — solicitação de cadastro pública
router.post('/requests', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
    const {
        contact_name, contact_email, contact_phone,
        business_name, category_id, short_description, description,
        phone, whatsapp, website, instagram, facebook,
        street, number, complement, neighborhood, city, state, zip_code,
    } = req.body;

    if (!contact_name || !contact_email || !business_name) {
        return res.status(400).json({ error: 'Nome do contato, e-mail e nome do negócio são obrigatórios.' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO requests
        (contact_name, contact_email, contact_phone, business_name, category_id,
         short_description, description, phone, whatsapp, website, instagram, facebook,
         street, number, complement, neighborhood, city, state, zip_code, ip_address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                contact_name, contact_email, contact_phone || null, business_name, category_id || null,
                short_description || null, description || null, phone || null, whatsapp || null,
                website || null, instagram || null, facebook || null,
                street || null, number || null, complement || null, neighborhood || null,
                city || null, state || null, zip_code || null, ip,
            ]
        );
        return res.status(201).json({ message: 'Solicitação enviada com sucesso! Em breve entraremos em contato.', id: result.insertId });
    } catch (err) {
        console.error('[Public] Request error:', err);
        return res.status(500).json({ error: 'Erro ao enviar solicitação.' });
    }
});

// GET /api/public/health — para Dockerfile HEALTHCHECK
router.get('/health', (req, res) => {
    return res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = router;

