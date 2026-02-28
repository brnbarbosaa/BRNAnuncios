import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SocialIcon, { SOCIAL_PREFIXES } from '../../components/SocialIcons';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AnuncioDetail() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgIdx, setImgIdx] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/public/businesses/${slug}`)
            .then(r => setData(r.data))
            .catch(() => navigate('/404'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div className="page-loading" style={{ paddingTop: 100 }}><div className="spinner" /></div>;
    if (!data) return null;

    const { business: b, images, hours, related, planFeatures = [] } = data;
    const hasFeat = (f) => planFeatures.includes(f);
    const allImages = b.logo ? [{ path: b.logo }, ...images] : images;
    const socialLinks = Array.isArray(b.social_links) ? b.social_links :
        (typeof b.social_links === 'string' ? (() => { try { return JSON.parse(b.social_links); } catch { return []; } })() : []);

    // Endereço formatado para Google Maps
    const addressParts = [b.street, b.number, b.neighborhood, b.city, b.state].filter(Boolean);
    const mapsQuery = encodeURIComponent(addressParts.join(', '));

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            <div className="container" style={{ padding: '40px 24px' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Link to="/">Home</Link>
                    <span className="material-icons-round" style={{ fontSize: 16 }}>chevron_right</span>
                    <Link to="/anuncios">Anúncios</Link>
                    <span className="material-icons-round" style={{ fontSize: 16 }}>chevron_right</span>
                    <span style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                </nav>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 32, alignItems: 'start' }}>
                    {/* ── Coluna esquerda ── */}
                    <div>
                        {/* Galeria */}
                        {allImages.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <div style={{
                                    height: 380, borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                                    background: 'var(--bg-surface)', position: 'relative'
                                }}>
                                    <img src={allImages[imgIdx]?.path} alt={b.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {allImages.length > 1 && (
                                        <>
                                            <button onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                                                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <span className="material-icons-round">chevron_left</span>
                                            </button>
                                            <button onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <span className="material-icons-round">chevron_right</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {allImages.length > 1 && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                                        {allImages.map((img, i) => (
                                            <div key={i} onClick={() => setImgIdx(i)}
                                                style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: `2px solid ${i === imgIdx ? 'var(--primary)' : 'var(--border-light)'}`, cursor: 'pointer', flex: '0 0 auto' }}>
                                                <img src={img.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Nome e categoria */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                                {b.category_name && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: b.category_color || 'var(--primary-light)', border: `1px solid ${b.category_color}44`, padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                                        <span className="material-icons-round" style={{ fontSize: 13 }}>{b.category_icon}</span>
                                        {b.category_name}
                                    </span>
                                )}
                                {hasFeat('verified_badge') && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                                        <span className="material-icons-round" style={{ fontSize: 13 }}>verified</span>
                                        Verificado
                                    </span>
                                )}
                                {b.plan === 'premium' && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', background: 'rgba(99,102,241,0.12)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                                        <span className="material-icons-round" style={{ fontSize: 13 }}>workspace_premium</span>
                                        Premium
                                    </span>
                                )}
                            </div>
                            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>{b.name}</h1>
                            {b.short_description && <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>{b.short_description}</p>}
                        </div>

                        {/* Descrição (Basic+) */}
                        {hasFeat('description') && b.description && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>Sobre o estabelecimento</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{b.description}</p>
                            </div>
                        )}

                        {/* Horários */}
                        {hours.length > 0 && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 16, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-icons-round" style={{ color: 'var(--primary-light)' }}>schedule</span>
                                    Horários de Funcionamento
                                </h3>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {hours.map(h => (
                                        <div key={h.day_of_week} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{DAYS[h.day_of_week]}</span>
                                            <span style={{ color: h.closed ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                                                {h.closed ? 'Fechado' : `${h.open_time} – ${h.close_time}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Endereço + Maps (Premium) */}
                        {hasFeat('address_map') && b.street && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 14, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-icons-round" style={{ color: 'var(--primary-light)' }}>place</span>
                                    Endereço
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                                    {[b.street, b.number, b.complement].filter(Boolean).join(', ')}<br />
                                    {[b.neighborhood, b.city, b.state].filter(Boolean).join(' — ')}
                                    {b.zip_code && ` — CEP: ${b.zip_code}`}
                                </p>
                                {mapsQuery && (
                                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 250 }}>
                                        <iframe
                                            title="Localização"
                                            width="100%" height="250" style={{ border: 0 }}
                                            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar direita ── */}
                    <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Card de contato */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                            <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Entrar em contato</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {b.whatsapp && (
                                    <a href={`https://wa.me/55${b.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                        className="btn btn-success" style={{ justifyContent: 'center', background: '#25d366' }}>
                                        <span className="material-icons-round">chat</span>
                                        WhatsApp
                                    </a>
                                )}
                                {b.phone && (
                                    <a href={`tel:${b.phone}`} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                        <span className="material-icons-round">call</span>
                                        {b.phone}
                                    </a>
                                )}
                                {b.email && (
                                    <a href={`mailto:${b.email}`} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                        <span className="material-icons-round">email</span>
                                        E-mail
                                    </a>
                                )}
                            </div>

                            {/* Redes sociais */}
                            {socialLinks.length > 0 && hasFeat('social_links') && (
                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {socialLinks.filter(l => l.platform && l.url).map((link, idx) => {
                                        const prefix = SOCIAL_PREFIXES[link.platform] || '';
                                        const url = link.url.startsWith('http') ? link.url : (prefix + link.url.replace('@', ''));
                                        return (
                                            <a key={idx} href={url} target="_blank" rel="noreferrer"
                                                className="btn btn-ghost btn-sm"
                                                title={link.platform}>
                                                <SocialIcon platform={link.platform} size={20} />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Fallback redes sociais antigas */}
                            {socialLinks.length === 0 && (b.instagram || b.facebook || b.website) && (
                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'center' }}>
                                    {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><span className="material-icons-round">language</span></a>}
                                    {b.instagram && <a href={`https://instagram.com/${b.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color: '#e1306c' }}><span className="material-icons-round">camera_alt</span></a>}
                                    {b.facebook && <a href={b.facebook} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color: '#1877f2' }}><span className="material-icons-round">thumb_up</span></a>}
                                </div>
                            )}
                        </div>

                        {/* Tags (Premium) */}
                        {hasFeat('tags') && b.tags && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
                                <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Tags</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {b.tags.split(',').filter(Boolean).map(t => (
                                        <span key={t} className="tag">{t.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '10px 14px', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>visibility</span>
                            {b.views.toLocaleString('pt-BR')} visualizações
                        </div>
                    </div>
                </div>

                {/* Relacionados */}
                {related.length > 0 && (
                    <div style={{ marginTop: 60 }}>
                        <h2 style={{ marginBottom: 24 }}>Você também pode gostar</h2>
                        <div className="businesses-grid">
                            {related.map(r => (
                                <Link key={r.id} to={`/anuncio/${r.slug}`} className="business-card">
                                    <div className="bcard-cover">
                                        {r.logo ? <img src={r.logo} alt={r.name} className="bcard-logo" /> : <div className="bcard-logo-placeholder"><span className="material-icons-round">store</span></div>}
                                    </div>
                                    <div className="bcard-body"><h3 className="bcard-name">{r.name}</h3><p className="bcard-desc">{r.short_description}</p></div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
