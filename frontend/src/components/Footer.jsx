import { Link } from 'react-router-dom';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-light)',
            padding: '48px 0 24px',
            marginTop: 80,
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
                    {/* Marca */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span className="material-icons-round" style={{ fontSize: 26, color: 'var(--primary-light)' }}>storefront</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                                BRN <span style={{ color: 'var(--primary-light)' }}>Anúncios</span>
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                            Conectando negócios locais com a comunidade do bairro.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Navegação
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[['/', 'Home'], ['/anuncios', 'Anúncios'], ['/solicitar-cadastro', 'Anunciar meu negócio']].map(([to, label]) => (
                                <Link key={to} to={to} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Área restrita */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Acesso
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[['/login', 'Entrar'], ['/solicitar-cadastro', 'Solicitar cadastro']].map(([to, label]) => (
                                <Link key={to} to={to} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        © {year} BRN Anúncios. Todos os direitos reservados.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Desenvolvido por <strong style={{ color: 'var(--primary-light)' }}>BRN Solution</strong>
                    </p>
                </div>
            </div>
        </footer>
    );
}
