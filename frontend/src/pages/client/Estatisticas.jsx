import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Mini bar chart component
function BarChart({ data }) {
    if (!data?.length) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Dados de visualizações aparecerão aqui conforme seu anúncio for acessado
        </div>
    );

    const max = Math.max(...data.map(d => d.views), 1);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, padding: '0 4px' }}>
            {data.map((d, i) => {
                const pct = (d.views / max) * 100;
                const dateLabel = new Date(d.day + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' }}
                        title={`${dateLabel}: ${d.views} visualizações`}>
                        <div style={{
                            width: '100%', maxWidth: 24, height: `${Math.max(pct, 4)}%`,
                            background: 'linear-gradient(to top, var(--primary), var(--primary-light))',
                            borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
                            minHeight: 4,
                        }} />
                        {data.length <= 14 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dateLabel}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function StatCard({ icon, label, value, color = 'var(--primary-light)', sub }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                    <span className="material-icons-round" style={{ fontSize: 26 }}>{icon}</span>
                </div>
                <div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
                </div>
            </div>
        </div>
    );
}

export default function ClientEstatisticas() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState(30); // dias

    useEffect(() => {
        api.get('/client/stats')
            .then(r => setStats(r.data))
            .catch(e => setError(e.response?.data?.error || 'Erro ao carregar estatísticas.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    // Plano bloqueado
    if (stats?.locked) return (
        <div>
            <div className="page-header"><div><h1>📊 Estatísticas</h1><p>Acompanhe o desempenho do seu anúncio</p></div></div>
            <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))',
                border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)',
                padding: '48px 32px', textAlign: 'center',
            }}>
                <span className="material-icons-round" style={{ fontSize: 56, color: 'var(--accent)', display: 'block', marginBottom: 14 }}>bar_chart</span>
                <h3 style={{ marginBottom: 8 }}>Painel de Estatísticas</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 12px' }}>
                    Acompanhe visualizações, gráficos de desempenho e muito mais.
                    <br />Seu anúncio já tem <strong>{stats.totalViews || 0}</strong> visualizações totais!
                </p>
                <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', padding: '4px 14px', fontWeight: 700 }}>
                    <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>workspace_premium</span>
                    Disponível no plano Premium
                </span>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span className="material-icons-round" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16 }}>bar_chart</span>
            <h3>Nenhum negócio vinculado</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Entre em contato com o administrador para vincular seu anúncio.</p>
        </div>
    );

    const filteredDays = stats.viewsByDay?.filter(d => {
        const daysAgo = (new Date() - new Date(d.day + 'T00:00:00')) / (1000 * 60 * 60 * 24);
        return daysAgo <= period;
    }) || [];

    const periodTotal = filteredDays.reduce((acc, d) => acc + Number(d.views), 0);

    const planBadge = { free: { label: 'Gratuito', color: 'var(--text-muted)' }, basic: { label: 'Básico', color: 'var(--info)' }, premium: { label: 'Premium', color: 'var(--accent)' } };
    const planInfo = planBadge[stats.plan] || planBadge.free;

    const memberSince = stats.memberSince
        ? new Date(stats.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : '—';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>📊 Estatísticas</h1>
                    <p>Acompanhe o desempenho do seu anúncio</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[7, 14, 30].map(d => (
                        <button key={d} className={`btn btn-sm ${period === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod(d)}>
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Status do anúncio */}
            {stats.status !== 'active' && (
                <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                    <span className="material-icons-round">warning</span>
                    Seu anúncio está <strong>{stats.status === 'pending' ? 'pendente de aprovação' : 'inativo'}</strong>.
                    Ele não está visível publicamente ainda.
                </div>
            )}

            {/* Cards de métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard icon="visibility" label="Visualizações totais" value={(stats.totalViews || 0).toLocaleString('pt-BR')} color="var(--info)" sub="Desde o início" />
                <StatCard icon="trending_up" label={`Visualizações (últimos ${period}d)`} value={periodTotal.toLocaleString('pt-BR')} color="var(--primary-light)" />
                <StatCard icon="photo_library" label="Fotos na galeria" value={stats.photoCount || 0} color="var(--success)" />
                <StatCard icon="star" label="Destaques ativos" value={stats.highlightCount || 0} color="var(--accent)"
                    sub={stats.featured ? '✅ Marcado como destaque' : '—'} />
            </div>

            {/* Gráfico de visualizações por dia */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Visualizações por dia</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Últimos {period} dias</p>
                    </div>
                    {periodTotal > 0 && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary-light)' }}>{periodTotal}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>no período</div>
                        </div>
                    )}
                </div>
                <BarChart data={filteredDays} />
            </div>

            {/* Plano e Informações */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '20px 24px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Seu Plano</h3>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: planInfo.color, marginBottom: 8 }}>{planInfo.label}</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Membro desde {memberSince}</p>
                    <Link to="/solicitar-cadastro" className="btn btn-ghost btn-sm">
                        <span className="material-icons-round" style={{ fontSize: 16 }}>upgrade</span>
                        Conhecer planos
                    </Link>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '20px 24px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Checklist</h3>
                    {[
                        { ok: stats.totalViews > 0, label: 'Anúncio visualizado por visitantes' },
                        { ok: stats.photoCount > 0, label: 'Galeria de fotos adicionada' },
                        { ok: stats.featured, label: 'Negócio em destaque' },
                        { ok: stats.highlightCount > 0, label: 'No carrossel da home' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span className="material-icons-round" style={{ fontSize: 18, color: item.ok ? 'var(--success)' : 'var(--border)' }}>
                                {item.ok ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span style={{ fontSize: '0.84rem', color: item.ok ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dicas */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(245,158,11,0.05))', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '20px 24px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--primary-light)' }}>💡 Dicas para mais visibilidade</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        'Adicione fotos de alta qualidade do seu negócio',
                        'Complete todos os campos do seu anúncio (endereço, horários, WhatsApp)',
                        'Mantenha os horários de funcionamento atualizados',
                        'Peça para clientes conhecerem seu anúncio pelo link público',
                    ].map((tip, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
