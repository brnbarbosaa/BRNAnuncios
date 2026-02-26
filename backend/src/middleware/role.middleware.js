/**
 * Middleware de controle de papel (role-based access).
 * Deve ser usado APÓS authMiddleware.
 * @param {...string} roles - Papéis permitidos ('admin', 'client')
 */
function roleMiddleware(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Acesso negado. Você não tem permissão para esta ação.',
            });
        }
        next();
    };
}

module.exports = { roleMiddleware };
