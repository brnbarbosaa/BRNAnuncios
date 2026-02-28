const router = require('express').Router();
const db = require('../config/db');
const { PLAN_FEATURES } = require('../utils/planFeatures');

// GET /api/public/home — dados completos da home
router.get('/home', async (req, res) => {
    try {
        // Carrossel — usa COALESCE para pegar banner_image OU logo do negócio
        const [carousel] = await db.execute(
            `SELECT h.id, h.title, h.subtitle,
              COALESCE(h.banner_image, b.logo) AS resolved_image,
              b.name, b.slug, b.short_description, b.logo, b.neighborhood
       FROM highlights h
       LEFT JOIN businesses b ON b.id = h.business_id
       WHERE h.type = 'carousel' AND h.active = 1 AND h.status = 'approved'
         AND (h.ends_at IS NULL OR h.ends_at > DATE_SUB(NOW(), INTERVAL 3 HOUR))
       ORDER BY h.sort_order ASC LIMIT 10`
        );

        // Cards de destaque rotativos
        const [cards] = await db.execute(
            `SELECT h.id, h.title, h.subtitle,
              b.name, b.slug, b.short_description, b.logo,
              b.neighborhood, b.city, cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM highlights h
       LEFT JOIN businesses b ON b.id = h.business_id
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE h.type = 'card' AND h.active = 1 AND h.status = 'approved'
         AND (h.ends_at IS NULL OR h.ends_at > DATE_SUB(NOW(), INTERVAL 3 HOUR))
       ORDER BY h.sort_order ASC LIMIT 20`
        );

        // Últimos 10 anúncios ativos (Premium primeiro, depois por data)
        const [latest] = await db.execute(
            `SELECT b.id, b.name, b.slug, b.short_description, b.logo,
              b.neighborhood, b.city, b.whatsapp, b.phone, b.plan,
              cat.name AS category_name, cat.color AS category_color, cat.icon AS category_icon
       FROM businesses b
       LEFT JOIN categories cat ON cat.id = b.category_id
       WHERE b.status = 'active'
       ORDER BY FIELD(b.plan, 'premium', 'basic', 'free'), b.created_at DESC LIMIT 10`
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

// GET /api/public/categories — categorias com contagem de negócios
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT cat.id, cat.name, cat.slug, cat.icon, cat.color,
                    COUNT(b.id) AS business_count,
                    COALESCE(SUM(b.views), 0) AS total_views
             FROM categories cat
             LEFT JOIN businesses b ON b.category_id = cat.id AND b.status = 'active'
             GROUP BY cat.id
             HAVING business_count > 0
             ORDER BY total_views DESC, business_count DESC, cat.name ASC
             LIMIT 6`
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar categorias.' });
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
       ORDER BY FIELD(b.plan, 'premium', 'basic', 'free'), b.featured DESC, b.created_at DESC
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
        const plan = business.plan || 'free';
        const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

        // Parse social_links
        if (business.social_links && typeof business.social_links === 'string') {
            try { business.social_links = JSON.parse(business.social_links); } catch { business.social_links = []; }
        }

        // Galeria — só se plano permite
        let images = [];
        if (features.includes('gallery')) {
            const [imgRows] = await db.execute(
                'SELECT id, path, caption, sort_order FROM business_images WHERE business_id = ? ORDER BY sort_order ASC',
                [business.id]
            );
            images = imgRows;
        }

        // Horários
        const [hours] = await db.execute(
            'SELECT day_of_week, open_time, close_time, closed FROM business_hours WHERE business_id = ? ORDER BY day_of_week ASC',
            [business.id]
        );

        // Incrementa views
        await db.execute('UPDATE businesses SET views = views + 1 WHERE id = ?', [business.id]);

        // Relacionados (mesma categoria)
        const [related] = await db.execute(
            `SELECT id, name, slug, short_description, logo, neighborhood, plan
       FROM businesses WHERE category_id = ? AND status = 'active' AND id != ? LIMIT 4`,
            [business.category_id, business.id]
        );

        return res.json({ business, images, hours, related, planFeatures: features });
    } catch (err) {
        console.error('[Public] Business detail error:', err);
        return res.status(500).json({ error: 'Erro ao carregar anúncio.' });
    }
});

// POST /api/public/requests — solicitação de cadastro pública (com plano)
router.post('/requests', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
    const {
        contact_name, contact_email, contact_phone,
        business_name, category_id, category_observation, short_description, description,
        phone, whatsapp, website, instagram, facebook,
        street, number, complement, neighborhood, city, state, zip_code,
        plan,
    } = req.body;

    if (!contact_name || !contact_email || !business_name) {
        return res.status(400).json({ error: 'Nome do contato, e-mail e nome do negócio são obrigatórios.' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO requests
        (contact_name, contact_email, contact_phone, business_name, category_id, category_observation,
         short_description, description, phone, whatsapp, website, instagram, facebook,
         street, number, complement, neighborhood, city, state, zip_code, ip_address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                contact_name, contact_email, contact_phone || null, business_name, category_id || null, category_observation || null,
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

// GET /api/public/plans — lista planos ativos para a home
router.get('/plans', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, slug, description, price, price_promo, features, highlight, contact_link FROM plans WHERE active = 1 ORDER BY sort_order ASC'
        );
        const plans = rows.map(p => ({
            ...p,
            features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
        }));
        return res.json(plans);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar planos.' });
    }
});

// GET /api/public/faqs — lista FAQs ativas para a home
router.get('/faqs', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, question, answer, sort_order FROM faqs WHERE active = 1 ORDER BY sort_order ASC'
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao carregar FAQs.' });
    }
});

module.exports = router;
