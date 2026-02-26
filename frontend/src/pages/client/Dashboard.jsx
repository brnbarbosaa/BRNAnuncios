import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/client/business').then(r => setBusiness(r.data.business)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    const links = [
        { to: '/cliente/meu-anuncio', icon: 'edit', label: 'Editar Anúncio', desc: 'Atualize as informações do seu negócio' },
        { to: '/cliente/galeria', icon: 'photo_library', label: 'Galeria de Fotos', desc: 'Adicione e organize suas fotos' },
        { to: '/cliente/horarios', icon: 'schedule', label: 'Horários', desc: 'Configure quando você está aberto' },
        { to: '/cliente/perfil', icon: 'person', label: 'Meu Perfil', desc: 'Altere seus dados e senha' },
    ];

    return (
        <div>
            {/* Boas-vindas */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1))', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Olá, {user?.name?.split(' ')[0]}! 👋</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie as informações do seu negócio abaixo.</p>
                {business && (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {business.logo && <img src={business.logo} alt="" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{business.name}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <span className={`badge ${business.status === 'active' ? 'badge-active' : 'badge-pending'}`}>{business.status === 'active' ? 'Ativo' : 'Pendente'}</span>
                                <span className="badge badge-info">{business.plan}</span>
                            </div>
                        </div>
                        {business.slug && (
                            <Link to={`/anuncio/${business.slug}`} className="btn btn-ghost btn-sm" target="_blank" style={{ marginLeft: 'auto' }}>
                                <span className="material-icons-round" style={{ fontSize: 16 }}>open_in_new</span>
                                Ver anúncio
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Stats rápidas */}
            {business && (
                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--info)' }}><span className="material-icons-round">visibility</span></div>
                        <div className="stat-info"><div className="stat-value" style={{ color: 'var(--info)' }}>{(business.views || 0).toLocaleString('pt-BR')}</div><div className="stat-label">Visualizações</div></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent)' }}><span className="material-icons-round">star</span></div>
                        <div className="stat-info"><div className="stat-value" style={{ color: 'var(--accent)' }}>{business.featured ? 'Sim' : 'Não'}</div><div className="stat-label">Em destaque</div></div>
                    </div>
                </div>
            )}

            {!business && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', marginBottom: 32 }}>
                    <span className="material-icons-round" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16 }}>store</span>
                    <h3 style={{ marginBottom: 8 }}>Nenhum negócio vinculado</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Entre em contato com o administrador para vincular seu anúncio.</p>
                </div>
            )}

            {/* Ações rápidas */}
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Acesso rápido</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {links.map(l => (
                    <Link key={l.to} to={l.to} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '18px', textDecoration: 'none', transition: 'all var(--transition-slow)', color: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0 }}>
                            <span className="material-icons-round">{l.icon}</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.label}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
