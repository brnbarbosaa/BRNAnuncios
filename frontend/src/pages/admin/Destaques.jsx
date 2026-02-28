import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_MAP = {
    pending: { label: 'Pendente', color: 'var(--accent)', icon: 'hourglass_top', bg: 'rgba(245,158,11,0.1)' },
    approved: { label: 'Aprovado', color: 'var(--success)', icon: 'check_circle', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Recusado', color: 'var(--danger)', icon: 'cancel', bg: 'rgba(239,68,68,0.1)' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString('pt-BR') : '—'; }

function nowSP() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    return d.toISOString().slice(0, 16);
}
function daysPlusSP(n) {
    const d = new Date(); d.setHours(d.getHours() - 3); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 16);
}

const NEW_FORM = () => ({
    business_id: '', type: 'card', title: '', subtitle: '',
    sort_order: 0, active: true,
    starts_at: nowSP(), ends_at: daysPlusSP(30),
});

// ── Item Card ─────────────────────────────────────────────────────
function HighlightItem({ item, onApprove, onReject, onEdit, onView, onDelete }) {
    const st = STATUS_MAP[item.status] || STATUS_MAP.approved;
    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid ${item.status === 'pending' ? 'var(--accent)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-lg)', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
        }}>
            {/* Logo */}
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0, cursor: 'pointer' }} onClick={() => onView(item)}>
                {item.logo ? <img src={item.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons-round" style={{ color: 'var(--text-muted)' }}>store</span>
                    </div>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => onView(item)}>{item.business_name}</strong>
                    <span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.7rem', padding: '2px 8px' }}>
                        <span className="material-icons-round" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 2 }}>{st.icon}</span>
                        {st.label}
                    </span>
                    {item.business_plan && (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: item.business_plan === 'premium' ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)', color: item.business_plan === 'premium' ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                            {item.business_plan === 'premium' ? '💎 Premium' : item.business_plan === 'basic' ? '⭐ Básico' : '🆓 Gratuito'}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {item.title && <span>📌 {item.title}</span>}
                    {item.status === 'approved' && <span>📅 {fmtDate(item.starts_at)} — {fmtDate(item.ends_at)}</span>}
                    {item.status === 'pending' && item.requested_at && <span>📨 Solicitado: {fmtDate(item.requested_at)}</span>}
                    {item.category_name && <span style={{ color: item.category_color }}>{item.category_name}</span>}
                </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {item.status === 'pending' && (
                    <>
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }} onClick={() => onApprove(item)}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>check</span> Aprovar
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => onReject(item)}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>close</span> Recusar
                        </button>
                    </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => onView(item)} title="Ver detalhes">
                    <span className="material-icons-round" style={{ fontSize: 16 }}>visibility</span>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(item)} title="Editar">
                    <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(item.id)} style={{ color: 'var(--danger)' }} title="Remover">
                    <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
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
    const [tab, setTab] = useState('carousel'); // 'carousel' | 'card'
    const [modal, setModal] = useState(null); // 'new' | item obj | null
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
                await api.post('/admin/highlights', { ...form, type: tab });
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

    const openNew = () => { setForm({ ...NEW_FORM(), type: tab }); setModal('new'); };

    // Filtra por aba
    const tabItems = items.filter(i => i.type === tab);
    const pendingCarousel = items.filter(i => i.type === 'carousel' && i.status === 'pending').length;
    const pendingCard = items.filter(i => i.type === 'card' && i.status === 'pending').length;

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>⭐ Destaques</h1>
                    <p>Gerencie o carrossel e cards de destaque da página inicial</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <span className="material-icons-round">add</span> Novo {tab === 'carousel' ? 'Carrossel' : 'Destaque'}
                </button>
            </div>

            {/* ── Abas ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-light)', marginBottom: 20 }}>
                {[
                    { key: 'carousel', label: 'Carrossel', icon: 'view_carousel', pending: pendingCarousel },
                    { key: 'card', label: 'Cards Destaque', icon: 'view_module', pending: pendingCard },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '12px 20px', border: 'none', cursor: 'pointer',
                        background: 'transparent',
                        color: tab === t.key ? 'var(--primary-light)' : 'var(--text-muted)',
                        fontWeight: tab === t.key ? 700 : 500, fontSize: '0.9rem',
                        borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.2s',
                    }}>
                        <span className="material-icons-round" style={{ fontSize: 18 }}>{t.icon}</span>
                        {t.label}
                        {t.pending > 0 && (
                            <span style={{
                                background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.68rem', fontWeight: 800
                            }}>{t.pending}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Pendentes alert */}
            {tabItems.some(i => i.status === 'pending') && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    <span className="material-icons-round">notifications_active</span>
                    <strong>{tabItems.filter(i => i.status === 'pending').length}</strong> solicitação(ões) pendente(s) de aprovação nesta aba
                </div>
            )}

            {/* Lista */}
            {tabItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <span className="material-icons-round" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>
                        {tab === 'carousel' ? 'view_carousel' : 'view_module'}
                    </span>
                    Nenhum {tab === 'carousel' ? 'item no carrossel' : 'card de destaque'} encontrado
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* pendentes primeiro */}
                    {tabItems.sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || a.sort_order - b.sort_order)
                        .map(item => (
                            <HighlightItem key={item.id} item={item}
                                onApprove={h => { setApproveModal(h); setApproveDays(7); }}
                                onReject={h => { setRejectModal(h); setRejectNotes(''); }}
                                onEdit={openEdit}
                                onView={h => setViewModal(h)}
                                onDelete={remove}
                            />
                        ))}
                </div>
            )}

            {/* ══════════ Modal Ver Detalhes ══════════ */}
            {viewModal && (
                <div className="modal-backdrop" onClick={() => setViewModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2>Detalhes do Destaque</h2>
                            <button className="modal-close" onClick={() => setViewModal(null)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Preview visual */}
                            <div style={{
                                height: 180, borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', marginBottom: 20,
                            }}>
                                {viewModal.logo ? (
                                    <img src={viewModal.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-muted)' }}>store</span>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 20px' }}>
                                    <span style={{ display: 'inline-flex', width: 'fit-content', background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                                        {viewModal.type === 'carousel' ? 'Carrossel' : 'Destaque'}
                                    </span>
                                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{viewModal.title || viewModal.business_name}</h3>
                                    {viewModal.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.82rem' }}>{viewModal.subtitle}</p>}
                                </div>
                            </div>

                            {/* Info grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: '0.85rem' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Negócio</div>
                                    <div style={{ fontWeight: 600 }}>{viewModal.business_name}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        color: (STATUS_MAP[viewModal.status] || STATUS_MAP.approved).color, fontWeight: 600
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>{(STATUS_MAP[viewModal.status] || STATUS_MAP.approved).icon}</span>
                                        {(STATUS_MAP[viewModal.status] || STATUS_MAP.approved).label}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Tipo</div>
                                    <div>{viewModal.type === 'carousel' ? '🖼️ Carrossel' : '🃏 Card de Destaque'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Plano</div>
                                    <div>{viewModal.business_plan === 'premium' ? '💎 Premium' : viewModal.business_plan === 'basic' ? '⭐ Básico' : '🆓 Gratuito'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Início</div>
                                    <div>{fmtDateTime(viewModal.starts_at)}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Fim</div>
                                    <div>{fmtDateTime(viewModal.ends_at)}</div>
                                </div>
                                {viewModal.requested_at && (
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Solicitado</div>
                                        <div>{fmtDateTime(viewModal.requested_at)}</div>
                                    </div>
                                )}
                                {viewModal.reviewed_at && (
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Revisado</div>
                                        <div>{fmtDateTime(viewModal.reviewed_at)}</div>
                                    </div>
                                )}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Ordem</div>
                                    <div>{viewModal.sort_order} — {viewModal.active ? '✅ Ativo' : '❌ Inativo'}</div>
                                </div>
                                {viewModal.admin_notes && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Notas do Admin</div>
                                        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>{viewModal.admin_notes}</div>
                                    </div>
                                )}
                                {viewModal.category_name && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Categoria</div>
                                        <span style={{ color: viewModal.category_color }}>{viewModal.category_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setViewModal(null)}>Fechar</button>
                            {viewModal.status === 'pending' && (
                                <>
                                    <button className="btn" style={{ background: 'var(--success)', color: '#fff' }}
                                        onClick={() => { setViewModal(null); setApproveModal(viewModal); setApproveDays(7); }}>
                                        <span className="material-icons-round">check</span> Aprovar
                                    </button>
                                    <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }}
                                        onClick={() => { setViewModal(null); setRejectModal(viewModal); setRejectNotes(''); }}>
                                        <span className="material-icons-round">close</span> Recusar
                                    </button>
                                </>
                            )}
                            <button className="btn btn-primary" onClick={() => { setViewModal(null); openEdit(viewModal); }}>
                                <span className="material-icons-round">edit</span> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ Modal Aprovar ══════════ */}
            {approveModal && (
                <div className="modal-backdrop" onClick={() => setApproveModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>✅ Aprovar Destaque</h2>
                            <button className="modal-close" onClick={() => setApproveModal(null)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)' }}>
                                {approveModal.logo && <img src={approveModal.logo} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />}
                                <div>
                                    <strong>{approveModal.business_name}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{approveModal.business_desc || ''}</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Período de exibição</label>
                                <select className="form-select" value={approveDays} onChange={e => setApproveDays(Number(e.target.value))}>
                                    <option value={3}>3 dias</option>
                                    <option value={7}>7 dias (recomendado)</option>
                                    <option value={14}>14 dias</option>
                                    <option value={30}>30 dias</option>
                                    <option value={60}>60 dias</option>
                                </select>
                            </div>
                            <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>info</span>
                                O negócio será exibido no {approveModal.type === 'carousel' ? 'carrossel' : 'painel de destaques'} por {approveDays} dias usando a imagem de capa do estabelecimento.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setApproveModal(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--success)', color: '#fff' }} onClick={approve} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <>
                                    <span className="material-icons-round">check_circle</span> Aprovar por {approveDays} dias</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ Modal Recusar ══════════ */}
            {rejectModal && (
                <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>❌ Recusar Solicitação</h2>
                            <button className="modal-close" onClick={() => setRejectModal(null)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)' }}>
                                {rejectModal.logo && <img src={rejectModal.logo} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />}
                                <strong>{rejectModal.business_name}</strong>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Motivo da recusa (opcional)</label>
                                <textarea className="form-textarea" rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                                    placeholder="Ex: Imagem de capa não atende os critérios, conteúdo inadequado..." />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Este motivo será exibido ao cliente.</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={reject} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <>
                                    <span className="material-icons-round">block</span> Recusar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ Modal Criar/Editar ══════════ */}
            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2>{modal === 'new' ? `Novo ${tab === 'carousel' ? 'Carrossel' : 'Destaque'}` : 'Editar Destaque'}</h2>
                            <button className="modal-close" onClick={() => setModal(null)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {modal === 'new' && (
                                <div className="form-group">
                                    <label className="form-label">Negócio</label>
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
                                    <label className="form-label">Ordem de exibição</label>
                                    <input className="form-input" type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Título (opcional — usa o nome do negócio se vazio)</label>
                                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título personalizado..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtítulo (opcional — usa a descrição curta se vazio)</label>
                                <input className="form-input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Subtítulo personalizado..." />
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                                <span>Ativo</span>
                            </label>

                            <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--info)' }}>info</span>
                                A imagem de capa (logo) do negócio será usada automaticamente.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
