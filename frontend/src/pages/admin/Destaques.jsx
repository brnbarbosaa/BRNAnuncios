import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_MAP = {
    pending: { label: 'Pendente', color: 'var(--accent)', icon: 'hourglass_top', bg: 'rgba(245,158,11,0.1)' },
    approved: { label: 'Aprovado', color: 'var(--success)', icon: 'check_circle', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Recusado', color: 'var(--danger)', icon: 'cancel', bg: 'rgba(239,68,68,0.1)' },
};

const TYPE_MAP = { carousel: 'Carrossel', card: 'Card' };

function nowSP() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    return d.toISOString().slice(0, 16);
}
function daysPlusSP(n) {
    const d = new Date(); d.setHours(d.getHours() - 3); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 16);
}

// ── Componente ────────────────────────────────────────────────────
const NEW_FORM = () => ({
    business_id: '', type: 'card', title: '', subtitle: '',
    sort_order: 0, active: true,
    starts_at: nowSP(), ends_at: daysPlusSP(30),
});

export default function AdminDestaques() {
    const [items, setItems] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'new' | item obj | null
    const [approveModal, setApproveModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [form, setForm] = useState(NEW_FORM());
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'carousel', 'card'
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
            setModal(null);
            load();
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
            setApproveModal(null);
            load();
        } catch (err) { alert(err.response?.data?.error || 'Erro'); }
        setSaving(false);
    };

    const reject = async () => {
        if (!rejectModal) return;
        setSaving(true);
        try {
            await api.put(`/admin/highlights/${rejectModal.id}/reject`, { admin_notes: rejectNotes });
            setRejectModal(null);
            setRejectNotes('');
            load();
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

    const openNew = () => { setForm(NEW_FORM()); setModal('new'); };

    const pendingCount = items.filter(i => i.status === 'pending').length;

    // Filtros
    const filtered = items.filter(i => {
        if (filter === 'pending') return i.status === 'pending';
        if (filter === 'approved') return i.status === 'approved';
        if (filter === 'carousel') return i.type === 'carousel';
        if (filter === 'card') return i.type === 'card';
        return true;
    });

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>⭐ Destaques</h1>
                    <p>Gerencie o carrossel e cards de destaque da página inicial</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <span className="material-icons-round">add</span> Novo destaque
                </button>
            </div>

            {/* Pendentes alert */}
            {pendingCount > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => setFilter('pending')}>
                    <span className="material-icons-round">notifications_active</span>
                    <strong>{pendingCount}</strong> solicitação(ões) pendente(s) de aprovação
                </div>
            )}

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'Todos', icon: 'list' },
                    { key: 'pending', label: `Pendentes (${pendingCount})`, icon: 'hourglass_top' },
                    { key: 'approved', label: 'Ativos', icon: 'check_circle' },
                    { key: 'carousel', label: 'Carrossel', icon: 'view_carousel' },
                    { key: 'card', label: 'Cards', icon: 'view_module' },
                ].map(f => (
                    <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
                        <span className="material-icons-round" style={{ fontSize: 16 }}>{f.icon}</span> {f.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <span className="material-icons-round" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>star_border</span>
                    Nenhum destaque encontrado
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(item => {
                        const st = STATUS_MAP[item.status] || STATUS_MAP.approved;
                        const start = item.starts_at ? new Date(item.starts_at).toLocaleDateString('pt-BR') : '—';
                        const end = item.ends_at ? new Date(item.ends_at).toLocaleDateString('pt-BR') : '—';
                        return (
                            <div key={item.id} style={{
                                background: 'var(--bg-card)', border: `1px solid ${item.status === 'pending' ? 'var(--accent)' : 'var(--border-light)'}`,
                                borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                                display: 'flex', alignItems: 'center', gap: 16,
                            }}>
                                {/* Logo */}
                                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0 }}>
                                    {item.logo ? <img src={item.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-icons-round" style={{ color: 'var(--text-muted)' }}>store</span>
                                        </div>}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <strong style={{ fontSize: '0.95rem' }}>{item.business_name}</strong>
                                        <span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.7rem', padding: '2px 8px' }}>
                                            <span className="material-icons-round" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 2 }}>{st.icon}</span>
                                            {st.label}
                                        </span>
                                        <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{TYPE_MAP[item.type]}</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {item.title && <span>{item.title}</span>}
                                        {item.status === 'approved' && <span style={{ marginLeft: 12 }}>📅 {start} — {end}</span>}
                                        {item.category_name && <span style={{ marginLeft: 12, color: item.category_color }}>{item.category_name}</span>}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {item.status === 'pending' && (
                                        <>
                                            <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }}
                                                onClick={() => { setApproveModal(item); setApproveDays(7); }}>
                                                <span className="material-icons-round" style={{ fontSize: 16 }}>check</span> Aprovar
                                            </button>
                                            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }}
                                                onClick={() => { setRejectModal(item); setRejectNotes(''); }}>
                                                <span className="material-icons-round" style={{ fontSize: 16 }}>close</span> Recusar
                                            </button>
                                        </>
                                    )}
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                                        <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)} style={{ color: 'var(--danger)' }}>
                                        <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal Aprovar ── */}
            {approveModal && (
                <div className="modal-backdrop" onClick={() => setApproveModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>Aprovar Destaque</h2>
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
                                <label className="form-label">Período de exibição (dias)</label>
                                <select className="form-select" value={approveDays} onChange={e => setApproveDays(Number(e.target.value))}>
                                    <option value={3}>3 dias</option>
                                    <option value={7}>7 dias</option>
                                    <option value={14}>14 dias</option>
                                    <option value={30}>30 dias</option>
                                </select>
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

            {/* ── Modal Recusar ── */}
            {rejectModal && (
                <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>Recusar Solicitação</h2>
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
                                <label className="form-label">Motivo (opcional — será exibido ao cliente)</label>
                                <textarea className="form-textarea" rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                                    placeholder="Ex: Imagem de capa não atende os critérios..." />
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

            {/* ── Modal Criar/Editar ── */}
            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modal === 'new' ? 'Novo Destaque' : 'Editar Destaque'}</h2>
                            <button className="modal-close" onClick={() => setModal(null)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {modal === 'new' && (
                                <div className="form-group">
                                    <label className="form-label">Negócio</label>
                                    <select className="form-select" value={form.business_id} onChange={e => set('business_id', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                                        <option value="carousel">Carrossel</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ordem</label>
                                    <input className="form-input" type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Título (opcional)</label>
                                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Usa o nome do negócio se vazio" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtítulo (opcional)</label>
                                <input className="form-input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Usa a descrição curta se vazio" />
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
                                Ativo
                            </label>

                            {/* Preview automático da imagem */}
                            {form.business_id && (
                                <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>info</span>
                                    A imagem de capa (logo) do negócio será usada automaticamente no carrossel.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
