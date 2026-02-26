const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

// GET /api/admin/logs — lista logs do sistema com filtros completos
router.get('/', async (req, res) => {
    try {
        const { q, action, level, entity, user_id, date_from, date_to, page = 1 } = req.query;
        const limit = 50;
        const offset = (parseInt(page) - 1) * limit;
        const params = [];
        let where = '1=1';

        if (q) {
            where += ' AND (l.action LIKE ? OR l.user_name LIKE ? OR l.ip_address LIKE ? OR JSON_SEARCH(l.details, "all", ?) IS NOT NULL)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (action) { where += ' AND l.action = ?'; params.push(action.toUpperCase()); }
        if (level) { where += ' AND l.level = ?'; params.push(level); }
        if (entity) { where += ' AND l.entity = ?'; params.push(entity); }
        if (user_id) { where += ' AND l.user_id = ?'; params.push(user_id); }
        if (date_from) { where += ' AND l.created_at >= ?'; params.push(`${date_from} 00:00:00`); }
        if (date_to) { where += ' AND l.created_at <= ?'; params.push(`${date_to} 23:59:59`); }

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM system_logs l WHERE ${where}`, params
        );

        const [logs] = await db.execute(
            `SELECT l.id, l.user_id, l.user_name, l.action, l.entity, l.entity_id,
              l.details, l.ip_address, l.user_agent, l.level, l.created_at
       FROM system_logs l
       WHERE ${where}
       ORDER BY l.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        // Contagem por nível para sumário
        const [summary] = await db.execute(
            `SELECT level, COUNT(*) AS count FROM system_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY level`
        );

        // Ações mais frequentes nas últimas 24h
        const [top_actions] = await db.execute(
            `SELECT action, COUNT(*) AS count FROM system_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY action ORDER BY count DESC LIMIT 10`
        );

        return res.json({
            logs,
            pagination: { total, page: parseInt(page), limit, pages: Math.ceil(total / limit) },
            summary,
            top_actions,
        });
    } catch (err) {
        console.error('[Logs] Error:', err);
        return res.status(500).json({ error: 'Erro ao carregar logs.' });
    }
});

// GET /api/admin/logs/actions — lista todas as actions distintas (para filtro no frontend)
router.get('/actions', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT DISTINCT action FROM system_logs ORDER BY action ASC');
        return res.json(rows.map(r => r.action));
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao listar ações.' });
    }
});

// DELETE /api/admin/logs/purge — limpa logs mais antigos que X dias
router.delete('/purge', async (req, res) => {
    try {
        const { days = 90 } = req.body;
        const [result] = await db.execute(
            `DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [parseInt(days)]
        );
        return res.json({ message: `${result.affectedRows} log(s) removido(s).`, deleted: result.affectedRows });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao limpar logs.' });
    }
});

module.exports = router;
