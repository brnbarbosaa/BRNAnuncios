const db = require('../config/db');

/**
 * Registra um evento no sistema de logs.
 * @param {object} params
 * @param {number|null}  params.userId    - ID do usuário (null = anônimo)
 * @param {string|null}  params.userName  - Nome do usuário no momento
 * @param {string}       params.action    - Ação realizada (ex: LOGIN, CREATE_BUSINESS)
 * @param {string|null}  params.entity    - Entidade afetada (ex: business, user)
 * @param {number|null}  params.entityId  - ID da entidade
 * @param {object|null}  params.details   - Objeto JSON com detalhes extras
 * @param {string|null}  params.ip        - IP do cliente
 * @param {string|null}  params.userAgent - User-Agent do cliente
 * @param {'info'|'warning'|'error'|'success'} params.level - Nível do log
 */
async function createLog({
    userId = null,
    userName = null,
    action,
    entity = null,
    entityId = null,
    details = null,
    ip = null,
    userAgent = null,
    level = 'info',
}) {
    try {
        await db.execute(
            `INSERT INTO system_logs
        (user_id, user_name, action, entity, entity_id, details, ip_address, user_agent, level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                userName,
                action.toUpperCase(),
                entity,
                entityId,
                details ? JSON.stringify(details) : null,
                ip,
                userAgent ? userAgent.substring(0, 500) : null,
                level,
            ]
        );
    } catch (err) {
        // Log de log não deve derrubar a aplicação
        console.error('[LOGGER] Falha ao registrar log:', err.message);
    }
}

module.exports = { createLog };
