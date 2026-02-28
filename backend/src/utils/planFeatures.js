/**
 * Definição centralizada de features por plano.
 * Usado no backend para validar permissões e no frontend (via API) para exibição condicional.
 */

const PLAN_FEATURES = {
    free: ['basic_info', 'contact', 'hours', 'cover_photo'],
    basic: ['basic_info', 'contact', 'hours', 'cover_photo', 'description', 'social_links', 'verified_badge'],
    premium: ['basic_info', 'contact', 'hours', 'cover_photo', 'description', 'social_links', 'verified_badge',
        'gallery', 'address_map', 'tags', 'statistics', 'highlight_request', 'search_priority'],
};

const PLAN_LIMITS = {
    free: { social_links: 0, gallery_photos: 0 },
    basic: { social_links: 5, gallery_photos: 0 },
    premium: { social_links: 5, gallery_photos: 5 },
};

/**
 * Verifica se um plano possui determinada feature.
 * @param {string} plan - 'free', 'basic', 'premium'
 * @param {string} feature - ex: 'gallery', 'social_links'
 * @returns {boolean}
 */
function planHasFeature(plan, feature) {
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    return features.includes(feature);
}

/**
 * Retorna os limites para o plano.
 */
function getPlanLimits(plan) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = { PLAN_FEATURES, PLAN_LIMITS, planHasFeature, getPlanLimits };
