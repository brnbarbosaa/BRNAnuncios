import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import BusinessCard from '../../components/BusinessCard';
import '../../components/BusinessCard.css';
import './Home.css';

export default function Home() {
    const [data, setData] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get('/public/home'),
            api.get('/public/plans').catch(() => ({ data: [] })),
        ]).then(([homeRes, plansRes]) => {
            setData(homeRes.data);
            setPlans(plansRes.data || []);
        }).finally(() => setLoading(false));
    }, []);

    // Auto-avanço do carrossel
    useEffect(() => {
        if (!data?.carousel?.length) return;
        const ms = parseInt(data.config?.carousel_interval || 5000);
        intervalRef.current = setInterval(() => {
            setCarouselIdx(i => (i + 1) % data.carousel.length);
        }, ms);
        return () => clearInterval(intervalRef.current);
    }, [data]);

    if (loading) return <div className="page-loading" style={{ paddingTop: 100 }}><div className="spinner" /><p>Carregando...</p></div>;

    const { carousel = [], cards = [], latest = [], config = {} } = data || {};
    const slide = carousel[carouselIdx];

    return (
        <div className="home-page">
            {/* ── Hero Carrossel ── */}
            {carousel.length > 0 && (
                <section className="carousel-section">
                    <div className="carousel-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
                        {carousel.map((item, i) => (
                            <div key={item.id} className="carousel-slide" style={{
                                backgroundImage: item.banner_image ? `url(${item.banner_image})` : undefined,
                                background: !item.banner_image ? 'radial-gradient(ellipse at 60% 30%, rgba(99,102,241,0.35) 0%, var(--bg-base) 70%)' : undefined,
                            }}>
                                <div className="carousel-overlay" />
                                <div className="carousel-content container">
                                    <div className="carousel-text">
                                        <span className="carousel-label">Destaque</span>
                                        <h1>{item.title || item.name}</h1>
                                        <p>{item.subtitle || item.short_description}</p>
                                        <Link to={`/anuncio/${item.slug}`} className="btn btn-primary btn-lg">
                                            <span className="material-icons-round">arrow_forward</span>
                                            Conhecer
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dots */}
                    {carousel.length > 1 && (
                        <div className="carousel-dots">
                            {carousel.map((_, i) => (
                                <button key={i} className={`carousel-dot ${i === carouselIdx ? 'active' : ''}`}
                                    onClick={() => { setCarouselIdx(i); clearInterval(intervalRef.current); }} />
                            ))}
                        </div>
                    )}

                    {/* Arrows */}
                    {carousel.length > 1 && (
                        <>
                            <button className="carousel-arrow left" onClick={() => setCarouselIdx(i => (i - 1 + carousel.length) % carousel.length)}>
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button className="carousel-arrow right" onClick={() => setCarouselIdx(i => (i + 1) % carousel.length)}>
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </>
                    )}
                </section>
            )}

            {/* ── Se não houver carrossel, hero padrão ── */}
            {carousel.length === 0 && (
                <section className="hero-section hero-gradient">
                    <div className="container hero-content">
                        <div className="hero-badge">
                            <span className="material-icons-round" style={{ fontSize: 14 }}>location_on</span>
                            Negócios do seu bairro
                        </div>
                        <h1>{config.site_slogan || 'Descubra os melhores negócios do seu bairro'}</h1>
                        <p>Encontre serviços, lojas e profissionais perto de você.</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Link to="/anuncios" className="btn btn-primary btn-lg">
                                <span className="material-icons-round">search</span>
                                Ver todos os anúncios
                            </Link>
                            <Link to="/solicitar-cadastro" className="btn btn-ghost btn-lg">
                                <span className="material-icons-round">add_business</span>
                                Anunciar meu negócio
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Cards Destaques Rotativos ── */}
            {cards.length > 0 && (
                <section className="section">
                    <div className="container">
                        <div className="section-title">
                            <h2>⭐ <span style={{ color: 'var(--primary-light)' }}>Destaques</span></h2>
                            <p>Os melhores negócios selecionados para você</p>
                        </div>
                        <div className="cards-scroll">
                            {cards.map(item => (
                                <Link key={item.id} to={`/anuncio/${item.slug}`} className="highlight-card">
                                    <div className="hcard-cover">
                                        {item.logo ? (
                                            <img src={item.logo} alt={item.name} />
                                        ) : (
                                            <span className="material-icons-round" style={{ fontSize: 36, color: item.category_color || 'var(--primary-light)' }}>
                                                {item.category_icon || 'store'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="hcard-info">
                                        <span className="hcard-category" style={{ color: item.category_color }}>{item.category_name}</span>
                                        <p className="hcard-name">{item.name}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Info Banner ── */}
            <section className="info-banner">
                <div className="container">
                    <div className="info-grid">
                        {[
                            { icon: 'store', val: '100+', label: 'Negócios cadastrados' },
                            { icon: 'people', val: '5K+', label: 'Acessos mensais' },
                            { icon: 'thumb_up', val: '98%', label: 'Clientes satisfeitos' },
                            { icon: 'speed', val: 'Grátis', label: 'Cadastro básico' },
                        ].map(item => (
                            <div key={item.label} className="info-item">
                                <span className="material-icons-round info-icon">{item.icon}</span>
                                <strong className="info-val">{item.val}</strong>
                                <span className="info-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Últimos Anúncios ── */}
            {latest.length > 0 && (
                <section className="section">
                    <div className="container">
                        <div className="section-title">
                            <h2>Anúncios <span style={{ color: 'var(--primary-light)' }}>Recentes</span></h2>
                            <p>Conheça os negócios mais recentemente cadastrados</p>
                        </div>
                        <div className="businesses-grid">
                            {latest.map(b => <BusinessCard key={b.id} business={b} />)}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <Link to="/anuncios" className="btn btn-ghost btn-lg">
                                Ver todos os anúncios
                                <span className="material-icons-round">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Planos ── */}
            {plans.length > 0 && (
                <section className="plans-section">
                    <div className="container">
                        <div className="section-title" style={{ textAlign: 'center' }}>
                            <h2>Nossos <span style={{ color: 'var(--primary-light)' }}>Planos</span></h2>
                            <p>Escolha o plano ideal para o seu negócio e aumente sua visibilidade</p>
                        </div>
                        <div className="plans-grid">
                            {plans.map(plan => {
                                const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');
                                const isHighlight = Boolean(plan.highlight);
                                const hasPromo = plan.price_promo && parseFloat(plan.price_promo) > 0;
                                const contactHref = plan.contact_link || '/solicitar-cadastro';
                                return (
                                    <div key={plan.id} className={`plan-card ${isHighlight ? 'plan-highlight' : ''}`}>
                                        {isHighlight && <div className="plan-badge-top">⭐ Mais Popular</div>}
                                        <div>
                                            <p className="plan-name">{plan.name}</p>
                                            {plan.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 6 }}>{plan.description}</p>}
                                        </div>
                                        <div className="plan-price">
                                            {parseFloat(plan.price) === 0 ? 'Grátis' : (
                                                hasPromo ? (
                                                    <>
                                                        <span style={{ textDecoration: 'line-through', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                                            R$ {parseFloat(plan.price).toFixed(2).replace('.', ',')}
                                                        </span>
                                                        {' '}
                                                        R$ {parseFloat(plan.price_promo).toFixed(2).replace('.', ',')}<span>/mês</span>
                                                    </>
                                                ) : (
                                                    <>R$ {parseFloat(plan.price).toFixed(2).replace('.', ',')}<span>/mês</span></>
                                                )
                                            )}
                                        </div>
                                        <ul className="plan-features">
                                            {features.map((f, i) => (
                                                <li key={i}><span className="material-icons-round">check_circle</span> {f}</li>
                                            ))}
                                        </ul>
                                        <a href={contactHref} className={`btn btn-lg ${isHighlight ? 'btn-primary' : 'btn-ghost'}`} style={{ textAlign: 'center' }}>
                                            <span className="material-icons-round">rocket_launch</span>
                                            {parseFloat(plan.price) === 0 ? 'Começar grátis' : 'Quero este plano'}
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA Final ── */}
            <section className="cta-section">
                <div className="container cta-content">
                    <h2>Seu negócio ainda não está aqui?</h2>
                    <p>Cadastre-se gratuitamente e alcance mais clientes no seu bairro.</p>
                    <Link to="/solicitar-cadastro" className="btn btn-accent btn-lg">
                        <span className="material-icons-round">add_business</span>
                        Quero anunciar meu negócio
                    </Link>
                </div>
            </section>
        </div>
    );
}
