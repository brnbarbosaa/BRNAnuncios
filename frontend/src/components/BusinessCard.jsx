import { Link } from 'react-router-dom';

export default function BusinessCard({ business }) {
    const {
        slug, name, logo, short_description,
        neighborhood, city, phone, whatsapp,
        category_name, category_color, category_icon,
        plan, featured,
    } = business;

    return (
        <Link to={`/anuncio/${slug}`} className="business-card">
            {featured && (
                <div className="bcard-featured-badge">
                    <span className="material-icons-round" style={{ fontSize: 12 }}>star</span>
                    Destaque
                </div>
            )}

            {/* Logo / capa */}
            <div className="bcard-cover">
                {logo ? (
                    <img src={logo} alt={name} className="bcard-logo" />
                ) : (
                    <div className="bcard-logo-placeholder">
                        <span className="material-icons-round">{category_icon || 'store'}</span>
                    </div>
                )}
                {plan === 'premium' && (
                    <span className="bcard-plan-badge">Premium</span>
                )}
            </div>

            {/* Conteúdo */}
            <div className="bcard-body">
                {/* Categoria */}
                {category_name && (
                    <span className="bcard-category" style={{ color: category_color || 'var(--primary-light)', borderColor: `${category_color}33` }}>
                        <span className="material-icons-round" style={{ fontSize: 13 }}>{category_icon || 'store'}</span>
                        {category_name}
                    </span>
                )}

                <h3 className="bcard-name">{name}</h3>
                {short_description && <p className="bcard-desc">{short_description}</p>}

                {/* Localização */}
                {(neighborhood || city) && (
                    <div className="bcard-location">
                        <span className="material-icons-round" style={{ fontSize: 14 }}>place</span>
                        <span>{[neighborhood, city].filter(Boolean).join(', ')}</span>
                    </div>
                )}
            </div>

            {/* Rodapé */}
            <div className="bcard-footer">
                {whatsapp && (
                    <span className="bcard-contact">
                        <span className="material-icons-round" style={{ fontSize: 14, color: '#25d366' }}>chat</span>
                        WhatsApp
                    </span>
                )}
                {phone && !whatsapp && (
                    <span className="bcard-contact">
                        <span className="material-icons-round" style={{ fontSize: 14, color: 'var(--primary-light)' }}>call</span>
                        {phone}
                    </span>
                )}
                <span className="bcard-cta">
                    Ver mais
                    <span className="material-icons-round" style={{ fontSize: 14 }}>arrow_forward</span>
                </span>
            </div>
        </Link>
    );
}
