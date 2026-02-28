import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUS_MAP = {
    pending: { label: 'Aguardando aprovação', color: 'var(--accent)', icon: 'hourglass_top', bg: 'rgba(245,158,11,0.1)' },
    approved: { label: 'Ativo no carrossel', color: 'var(--success)', icon: 'check_circle', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Recusado', color: 'var(--danger)', icon: 'cancel', bg: 'rgba(239,68,68,0.1)' },
};

export default function ClientDestaque() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/client/highlight')
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const request = async () => {
        setSending(true);
        setAlert(null);
        try {
            const res = await api.post('/client/highlight');
            setAlert({ type: 'success', msg: res.data.message });
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Erro ao solicitar destaque.' });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    if (!data) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span className="material-icons-round" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16 }}>store</span>
            <h3>Nenhum negócio vinculado</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Entre em contato com o administrador.</p>
        </div>
    );

    const { canRequest, plan, business, highlights } = data;
    const activeH = highlights.find(h => h.status === 'approved' && h.active);
    const pendingH = highlights.find(h => h.status === 'pending');
    const hasActiveOrPending = !!activeH || !!pendingH;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>⭐ Destaque no Carrossel</h1>
                    <p>Apareça em destaque na página inicial para milhares de visitantes</p>
                </div>
            </div>

            {alert && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
                    <span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
                    {alert.msg}
                </div>
            )}

            {/* Preview */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 24 }}>
                <div style={{
                    height: 200, position: 'relative',
                    backgroundImage: business.logo ? `url(${business.logo})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    background: !business.logo ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.15))' : undefined,
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 28px',
                    }}>
                        <span style={{ display: 'inline-flex', width: 'fit-content', background: 'var(--primary)', color: '#fff', padding: '3px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                            Destaque
                        </span>
                        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem' }}>{business.name}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.9rem' }}>{business.short_description || ''}</p>
                    </div>
                </div>
                <div style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-icons-round" style={{ fontSize: 16 }}>preview</span>
                    Preview de como seu negócio aparece no carrossel da página inicial
                </div>
            </div>

            {/* Status de destaques existentes */}
            {highlights.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Histórico de Destaques</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {highlights.map(h => {
                            const st = STATUS_MAP[h.status] || STATUS_MAP.pending;
                            const start = h.starts_at ? new Date(h.starts_at).toLocaleDateString('pt-BR') : '—';
                            const end = h.ends_at ? new Date(h.ends_at).toLocaleDateString('pt-BR') : '—';
                            return (
                                <div key={h.id} style={{
                                    background: st.bg, border: `1px solid ${st.color}30`,
                                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                }}>
                                    <span className="material-icons-round" style={{ fontSize: 28, color: st.color }}>{st.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: st.color, marginBottom: 4 }}>{st.label}</div>
                                        {h.status === 'approved' && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                Período: {start} — {end}
                                            </div>
                                        )}
                                        {h.status === 'rejected' && h.admin_notes && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                Motivo: {h.admin_notes}
                                            </div>
                                        )}
                                        {h.status === 'pending' && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                Solicitado em {h.requested_at ? new Date(h.requested_at).toLocaleDateString('pt-BR') : '—'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ação */}
            {!canRequest ? (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)',
                    padding: '32px', textAlign: 'center',
                }}>
                    <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--accent)', display: 'block', marginBottom: 12 }}>workspace_premium</span>
                    <h3 style={{ marginBottom: 8 }}>Recurso exclusivo Premium</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                        O destaque no carrossel da página inicial está disponível para o plano Premium.
                        <br />Faça upgrade para que seu negócio seja destaque para milhares de visitantes!
                    </p>
                    <span className="badge" style={{ background: 'var(--accent)', color: '#fff', padding: '4px 14px' }}>
                        Seu plano: {plan === 'free' ? 'Gratuito' : plan === 'basic' ? 'Básico' : 'Premium'}
                    </span>
                </div>
            ) : !hasActiveOrPending ? (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.06))',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)',
                    padding: '32px', textAlign: 'center',
                }}>
                    <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--primary-light)', display: 'block', marginBottom: 12 }}>campaign</span>
                    <h3 style={{ marginBottom: 8 }}>Solicite destaque no carrossel!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
                        Seu negócio aparecerá em destaque na página inicial para todos os visitantes.
                        O administrador irá analisar e aprovar sua solicitação.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={request} disabled={sending}>
                        {sending ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                            : <><span className="material-icons-round">star</span> Solicitar Destaque</>}
                    </button>
                </div>
            ) : null}

            {/* Info */}
            <div style={{
                marginTop: 24, padding: '18px 22px',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 'var(--radius-lg)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7,
            }}>
                <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', color: 'var(--info)', marginRight: 6 }}>info</span>
                Ao solicitar destaque, o administrador irá analisar sua solicitação e definir o período de exibição.
                Sua imagem de capa será usada automaticamente como fundo do anúncio no carrossel.
            </div>
        </div>
    );
}
