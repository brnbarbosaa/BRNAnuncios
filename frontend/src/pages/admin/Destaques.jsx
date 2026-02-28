import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_MAP = {
    pending: { label: 'Pendente', color: 'var(--accent)', icon: 'hourglass_top', bg: 'rgba(245,158,11,0.12)' },
    approved: { label: 'Aprovado', color: 'var(--success)', icon: 'check_circle', bg: 'rgba(16,185,129,0.12)' },
    rejected: { label: 'Recusado', color: 'var(--danger)', icon: 'cancel', bg: 'rgba(239,68,68,0.12)' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString('pt-BR') : '—'; }

function nowISO() { const d = new Date(); d.setHours(d.getHours() - 3); return d.toISOString().slice(0, 16); }
function daysPlusISO(n) { const d = new Date(); d.setHours(d.getHours() - 3); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 16); }

const NEW_FORM = (type) => ({
    business_id: '', type: type || 'carousel', title: '', subtitle: '',
    sort_order: 0, active: true, starts_at: nowISO(), ends_at: daysPlusISO(30),
});

// ── Item Card ─────────────────────────────────────────────────────
function HighlightItem({ item, onApprove, onReject, onEdit, onView, onDelete, showType }) {
    const st = STATUS_MAP[item.status] || STATUS_MAP.approved;
    const isActive = item.active && item.status === 'approved';
    const isExpired = item.ends_at && new Date(item.ends_at) < new Date();

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${item.status === 'pending' ? 'rgba(245,158,11,0.4)' : isActive && !isExpired ? 'rgba(16,185,129,0.25)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-lg)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'all 0.2s', cursor: 'pointer',
            opacity: isExpired ? 0.6 : 1,
        }}
            onClick={() => onView(item)}
        >
            {/* Indicador ativo */}
            <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
                background: isExpired ? 'var(--text-muted)' : isActive ? 'var(--success)' : item.status === 'pending' ? 'var(--accent)' : 'var(--danger)',
            }} />

            {/* Logo */}
            <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0 }}>
                {item.logo ? <img src={item.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons-round" style={{ color: 'var(--text-muted)', fontSize: 20 }}>store</span>
                    </div>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{item.business_name}</strong>
                    <span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.65rem', padding: '1px 7px' }}>
                        <span className="material-icons-round" style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 2 }}>{st.icon}</span>
                        {st.label}
                    </span>
                    {showType && (
                        <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 6px', background: item.type === 'carousel' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: item.type === 'carousel' ? 'var(--primary-light)' : 'var(--accent)' }}>
                            {item.type === 'carousel' ? '🖼️ Carrossel' : '🃏 Card'}
                        </span>
                    )}
                    {/* Ativo/Inativo badge */}
                    {item.status === 'approved' && (
                        <span style={{
                            fontSize: '0.6rem', padding: '1px 6px', borderRadius: 'var(--radius-full)', fontWeight: 700,
                            background: isExpired ? 'rgba(100,116,139,0.12)' : isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: isExpired ? 'var(--text-muted)' : isActive ? 'var(--success)' : 'var(--danger)',
                        }}>
                            {isExpired ? '⏰ Expirado' : isActive ? '🟢 Ativo' : '🔴 Inativo'}
                        </span>
                    )}
                    {item.business_plan === 'premium' && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--primary-light)' }}>💎</span>
                    )}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {item.title && <span>📌 {item.title}</span>}
                    {item.status === 'approved' && <span>📅 {fmtDate(item.starts_at)} — {fmtDate(item.ends_at)}</span>}
                    {item.status === 'pending' && item.requested_at && <span>📨 {fmtDate(item.requested_at)}</span>}
                </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {item.status === 'pending' && (
                    <>
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', padding: '5px 10px' }} onClick={() => onApprove(item)} title="Aprovar">
                            <span className="material-icons-round" style={{ fontSize: 15 }}>check</span>
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', padding: '5px 10px' }} onClick={() => onReject(item)} title="Recusar">
                            <span className="material-icons-round" style={{ fontSize: 15 }}>close</span>
                        </button>
                    </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(item)} title="Editar" style={{ padding: '5px 8px' }}>
                    <span className="material-icons-round" style={{ fontSize: 15 }}>edit</span>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(item.id)} style={{ color: 'var(--danger)', padding: '5px 8px' }} title="Remover">
                    <span className="material-icons-round" style={{ fontSize: 15 }}>delete</span>
                </button>
            </div>
        </div>
    );
}

// ── Componente Principal ──────────────────────────────────────────
export default function AdminDestaques() {
    const [items, setItems] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending'); // 'pending' | 'carousel' | 'card' | 'active'
    const [modal, setModal] = useState(null);
    const [viewModal, setViewModal] = useState(null);
    const [approveModal, setApproveModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [form, setForm] = useState(NEW_FORM());
    const [saving, setSaving] = useState(false);
    const [approveDays, setApproveDays] = useState(7);
    const [rejectNotes, setRejectNotes] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [hRes, bRes] = await Promise.all([
                api.get('/admin/highlights'),
                api.get('/admin/businesses'),
            ]);
            setItems(hRes.data);
            setBusinesses(bRes.data?.businesses || bRes.data || []);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.business_id && !modal?.id) return;
        setSaving(true);
        try {
            if (modal?.id) {
                await api.put(`/admin/highlights/${modal.id}`, form);
            } else {
                await api.post('/admin/highlights', form);
            }
            setModal(null); load();
        } catch (err) { alert(err.response?.data?.error || 'Erro'); }
        setSaving(false);
    };

    const remove = async (id) => {
        if (!window.confirm('Remover destaque?')) return;
        await api.delete(`/admin/highlights/${id}`);
        load();
    };

    const approve = async () => {
        if (!approveModal) return;
        setSaving(true);
        try {
            await api.put(`/admin/highlights/${approveModal.id}/approve`, { days: approveDays });
            setApproveModal(null); load();
        } catch (err) { alert(err.response?.data?.error || 'Erro'); }
        setSaving(false);
    };

    const reject = async () => {
        if (!rejectModal) return;
        setSaving(true);
        try {
            await api.put(`/admin/highlights/${rejectModal.id}/reject`, { admin_notes: rejectNotes });
            setRejectModal(null); setRejectNotes(''); load();
        } catch (err) { alert(err.response?.data?.error || 'Erro'); }
        setSaving(false);
    };

    const openEdit = (item) => {
        setForm({
            business_id: item.business_id, type: item.type,
            title: item.title || '', subtitle: item.subtitle || '',
            sort_order: item.sort_order || 0, active: !!item.active,
            starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : '',
            ends_at: item.ends_at ? new Date(item.ends_at).toISOString().slice(0, 16) : '',
        });
        setModal(item);
    };

    const openNew = () => {
        const type = tab === 'carousel' ? 'carousel' : tab === 'card' ? 'card' : 'carousel';
        setForm(NEW_FORM(type));
        setModal('new');
    };

    // ── Contagens ──
    const now = new Date();
    const pendingAll = items.filter(i => i.status === 'pending');
    const activeCarousel = items.filter(i => i.type === 'carousel' && i.status === 'approved' && i.active && (!i.ends_at || new Date(i.ends_at) >= now));
    const activeCards = items.filter(i => i.type === 'card' && i.status === 'approved' && i.active && (!i.ends_at || new Date(i.ends_at) >= now));
    const allCarousel = items.filter(i => i.type === 'carousel');
    const allCards = items.filter(i => i.type === 'card');

    // ── Itens filtrados pela aba ──
    let filteredItems = [];
    let showType = false;
    if (tab === 'pending') {
        filteredItems = pendingAll;
        showType = true;
    } else if (tab === 'carousel') {
        filteredItems = allCarousel;
    } else if (tab === 'card') {
        filteredItems = allCards;
    } else if (tab === 'active') {
        filteredItems = [...activeCarousel, ...activeCards];
        showType = true;
    }

    // Ordenar: pendentes primeiro, depois ativos, depois inativos/expirados
    const sortedItems = [...filteredItems].sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (diff !== 0) return diff;
        // Ativos antes de inativos/expirados
        const aActive = a.active && (!a.ends_at || new Date(a.ends_at) >= now) ? 0 : 1;
        const bActive = b.active && (!b.ends_at || new Date(b.ends_at) >= now) ? 0 : 1;
        return aActive - bActive || (a.sort_order || 0) - (b.sort_order || 0);
    });

    const TABS = [
        { key: 'pending', label: 'Pendentes', icon: 'pending_actions', count: pendingAll.length, accent: pendingAll.length > 0 },
        { key: 'carousel', label: 'Carrossel', icon: 'view_carousel', count: allCarousel.length, sub: `${activeCarousel.length} ativos` },
        { key: 'card', label: 'Cards Destaque', icon: 'view_module', count: allCards.length, sub: `${activeCards.length} ativos` },
        { key: 'active', label: 'Ativos Agora', icon: 'visibility', count: activeCarousel.length + activeCards.length },
    ];

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>⭐ Destaques</h1>
                    <p>Gerencie o carrossel e cards de destaque</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <span className="material-icons-round">add</span> Novo Destaque
                </button>
            </div>

            {/* ── Abas ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-light)', marginBottom: 20, overflowX: 'auto' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '12px 18px', border: 'none', cursor: 'pointer',
                        background: 'transparent', whiteSpace: 'nowrap',
                        color: tab === t.key ? 'var(--primary-light)' : 'var(--text-muted)',
                        fontWeight: tab === t.key ? 700 : 500, fontSize: '0.85rem',
                        borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.2s',
                    }}>
                        <span className="material-icons-round" style={{ fontSize: 17 }}>{t.icon}</span>
                        {t.label}
                        {t.count > 0 && (
                            <span style={{
                                background: t.accent ? 'var(--accent)' : 'var(--bg-surface)',
                                color: t.accent ? '#fff' : 'var(--text-muted)',
                                borderRadius: 'var(--radius-full)',
                                padding: '1px 8px', fontSize: '0.68rem', fontWeight: 800,
                                minWidth: 20, textAlign: 'center',
                            }}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Info da aba ativa */}
            {tab === 'active' && (
                <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--primary-light)' }}>view_carousel</span>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-light)' }}>{activeCarousel.length}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ativos no Carrossel</div>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-icons-round" style={{ fontSize: 22, color: 'var(--accent)' }}>view_module</span>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{activeCards.length}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ativos nos Cards</div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'pending' && pendingAll.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <span className="material-icons-round" style={{ fontSize: 52, display: 'block', marginBottom: 14, color: 'var(--success)' }}>task_alt</span>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Nenhuma pendência! 🎉</h3>
                    <p style={{ fontSize: '0.85rem' }}>Todas as solicitações foram analisadas.</p>
                </div>
            )}

            {/* ── Lista ── */}
            {sortedItems.length === 0 && tab !== 'pending' ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <span className="material-icons-round" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>
                        {tab === 'carousel' ? 'view_carousel' : tab === 'active' ? 'visibility_off' : 'view_module'}
                    </span>
                    Nenhum item encontrado nesta aba
                </div>
            ) : sortedItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sortedItems.map(item => (
                        <HighlightItem key={item.id} item={item}
                            showType={showType}
                            onApprove={h => { setApproveModal(h); setApproveDays(7); }}
                            onReject={h => { setRejectModal(h); setRejectNotes(''); }}
                            onEdit={openEdit}
                            onView={h => setViewModal(h)}
                            onDelete={remove}
                        />
                    ))}
                </div>
            )}

            {/* ══════════ MODAL: Ver Detalhes ══════════ */}
            {viewModal && (
                <div className="modal-overlay" onClick={() => setViewModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary-light)' }}>visibility</span>
                                Detalhes do Destaque
                            </h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(null)} style={{ padding: '6px' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ height: 150, borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', marginBottom: 20 }}>
                                {viewModal.logo ? (
                                    <img src={viewModal.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(16,185,129,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-muted)' }}>store</span>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 18px' }}>
                                    <span style={{ display: 'inline-flex', width: 'fit-content', background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                                        {viewModal.type === 'carousel' ? '🖼️ Carrossel' : '🃏 Destaque'}
                                    </span>
                                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>{viewModal.title || viewModal.business_name}</h3>
                                    {viewModal.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.8rem' }}>{viewModal.subtitle}</p>}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: '0.83rem' }}>
                                <InfoCell label="Negócio" value={viewModal.business_name} />
                                <InfoCell label="Status">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: (STATUS_MAP[viewModal.status] || STATUS_MAP.approved).color, fontWeight: 600 }}>
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>{(STATUS_MAP[viewModal.status] || STATUS_MAP.approved).icon}</span>
                                        {(STATUS_MAP[viewModal.status] || STATUS_MAP.approved).label}
                                    </span>
                                </InfoCell>
                                <InfoCell label="Plano" value={viewModal.business_plan === 'premium' ? '💎 Premium' : viewModal.business_plan === 'basic' ? '⭐ Básico' : '🆓 Gratuito'} />
                                <InfoCell label="Tipo" value={viewModal.type === 'carousel' ? '🖼️ Carrossel' : '🃏 Card'} />
                                <InfoCell label="Início" value={fmtDateTime(viewModal.starts_at)} />
                                <InfoCell label="Fim" value={fmtDateTime(viewModal.ends_at)} />
                                {viewModal.requested_at && <InfoCell label="Solicitado" value={fmtDateTime(viewModal.requested_at)} />}
                                {viewModal.reviewed_at && <InfoCell label="Revisado" value={fmtDateTime(viewModal.reviewed_at)} />}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <InfoCell label="Exibição" value={`Ordem #${viewModal.sort_order} — ${viewModal.active ? '🟢 Ativo' : '🔴 Inativo'}${viewModal.ends_at && new Date(viewModal.ends_at) < new Date() ? ' — ⏰ Expirado' : ''}`} />
                                </div>
                                {viewModal.admin_notes && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <InfoCell label="Notas do Admin">
                                            <div style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{viewModal.admin_notes}</div>
                                        </InfoCell>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setViewModal(null)}>Fechar</button>
                            {viewModal.status === 'pending' && (
                                <>
                                    <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }}
                                        onClick={() => { setViewModal(null); setApproveModal(viewModal); setApproveDays(7); }}>
                                        <span className="material-icons-round" style={{ fontSize: 15 }}>check</span> Aprovar
                                    </button>
                                    <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }}
                                        onClick={() => { setViewModal(null); setRejectModal(viewModal); setRejectNotes(''); }}>
                                        <span className="material-icons-round" style={{ fontSize: 15 }}>close</span> Recusar
                                    </button>
                                </>
                            )}
                            <button className="btn btn-primary btn-sm" onClick={() => { setViewModal(null); openEdit(viewModal); }}>
                                <span className="material-icons-round" style={{ fontSize: 15 }}>edit</span> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MODAL: Aprovar ══════════ */}
            {approveModal && (
                <div className="modal-overlay" onClick={() => setApproveModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--success)' }}>check_circle</span>
                                Aprovar Destaque
                            </h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setApproveModal(null)} style={{ padding: '6px' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                {approveModal.logo && <img src={approveModal.logo} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />}
                                <div>
                                    <strong style={{ fontSize: '0.92rem' }}>{approveModal.business_name}</strong>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{approveModal.type === 'carousel' ? '🖼️ Carrossel' : '🃏 Card Destaque'}</div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Período de exibição</label>
                                <select className="form-select" value={approveDays} onChange={e => setApproveDays(Number(e.target.value))}>
                                    <option value={3}>3 dias</option>
                                    <option value={7}>7 dias (recomendado)</option>
                                    <option value={14}>14 dias</option>
                                    <option value={30}>30 dias</option>
                                    <option value={60}>60 dias</option>
                                </select>
                            </div>
                            <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>info</span>
                                Será exibido por <strong>{approveDays}</strong> dias usando a imagem de capa do negócio.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setApproveModal(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--success)', color: '#fff' }} onClick={approve} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <>
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>check_circle</span> Aprovar {approveDays}d</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MODAL: Recusar ══════════ */}
            {rejectModal && (
                <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--danger)' }}>block</span>
                                Recusar Solicitação
                            </h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(null)} style={{ padding: '6px' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                {rejectModal.logo && <img src={rejectModal.logo} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />}
                                <strong style={{ fontSize: '0.92rem' }}>{rejectModal.business_name}</strong>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Motivo da recusa (opcional)</label>
                                <textarea className="form-textarea" rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                                    placeholder="Ex: Imagem de capa não atende os critérios..." style={{ minHeight: 80 }} />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Este motivo será exibido ao cliente.</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={reject} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <>
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>block</span> Recusar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MODAL: Criar / Editar ══════════ */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary-light)' }}>
                                    {modal === 'new' ? 'add_circle' : 'edit'}
                                </span>
                                {modal === 'new' ? 'Novo Destaque' : 'Editar Destaque'}
                            </h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)} style={{ padding: '6px' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {modal === 'new' && (
                                <div className="form-group">
                                    <label className="form-label">Negócio *</label>
                                    <select className="form-select" value={form.business_id} onChange={e => set('business_id', e.target.value)}>
                                        <option value="">Selecione um negócio...</option>
                                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                                        <option value="carousel">🖼️ Carrossel</option>
                                        <option value="card">🃏 Card Destaque</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ordem</label>
                                    <input className="form-input" type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Título (opcional)</label>
                                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Usa o nome do negócio se vazio..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtítulo (opcional)</label>
                                <input className="form-input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Usa a descrição curta se vazio..." />
                            </div>
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Início</label>
                                    <input className="form-input" type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fim</label>
                                    <input className="form-input" type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} />
                                </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                                Ativo
                            </label>
                            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="material-icons-round" style={{ fontSize: 15, color: 'var(--info)' }}>info</span>
                                A imagem de capa do negócio será usada automaticamente.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><span className="material-icons-round" style={{ fontSize: 16 }}>save</span> Salvar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Componente auxiliar ──
function InfoCell({ label, value, children }) {
    return (
        <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
            {children || <div style={{ fontWeight: 500 }}>{value}</div>}
        </div>
    );
}
