import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const LEVEL_COLORS = { info: 'var(--info)', success: 'var(--success)', warning: 'var(--accent)', error: 'var(--danger)' };
const LEVEL_ICONS = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    const statCards = [
        { icon: 'store', label: 'Total de Anúncios', val: stats.total_businesses, color: '#6366f1', bg: 'rgba(99,102,241,0.15)', link: '/admin/anuncios' },
        { icon: 'check_circle', label: 'Anúncios Ativos', val: stats.active_businesses, color: 'var(--success)', bg: 'rgba(16,185,129,0.15)', link: '/admin/anuncios?status=active' },
        { icon: 'people', label: 'Clientes', val: stats.total_users, color: 'var(--info)', bg: 'rgba(59,130,246,0.15)', link: '/admin/usuarios' },
        { icon: 'inbox', label: 'Req. Pendentes', val: stats.pending_requests, color: 'var(--accent)', bg: 'rgba(245,158,11,0.15)', link: '/admin/requisicoes' },
        { icon: 'visibility', label: 'Total de Views', val: stats.total_views?.toLocaleString('pt-BR'), color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.1)', link: null },
    ];

    return (
        <div>
            <div className="page-header">
                <div><h1>Dashboard</h1><p>Visão geral do sistema</p></div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/admin/requisicoes" className="btn btn-accent btn-sm">
                        {stats.pending_requests > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{stats.pending_requests}</span>}
                        <span className="material-icons-round">inbox</span>
                        Requisições
                    </Link>
                    <Link to="/admin/anuncios/novo" className="btn btn-primary btn-sm">
                        <span className="material-icons-round">add</span>
                        Novo Anúncio
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {statCards.map(s => (
                    <div key={s.label} className="stat-card" style={{ cursor: s.link ? 'pointer' : 'default' }}
                        onClick={() => s.link && (window.location.href = s.link)}>
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                            <span className="material-icons-round">{s.icon}</span>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color }}>{s.val ?? 0}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs recentes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1rem' }}>⚡ Atividade Recente</h3>
                    <Link to="/admin/logs" className="btn btn-ghost btn-sm">Ver todos os logs</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.recent_logs?.map(log => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${LEVEL_COLORS[log.level]}` }}>
                            <span className="material-icons-round" style={{ fontSize: 18, color: LEVEL_COLORS[log.level] }}>{LEVEL_ICONS[log.level]}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '1px 8px', borderRadius: 'var(--radius-full)' }}>{log.action}</span>
                                    {log.entity && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.entity}</span>}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    {log.user_name || 'Sistema'} — {new Date(log.created_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
