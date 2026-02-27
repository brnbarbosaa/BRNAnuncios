import { useState, useEffect } from 'react';
import api from '../../services/api';

// ── Helpers de timezone São Paulo ────────────────────────────────────────────
const SP_TZ = 'America/Sao_Paulo';

function formatSP(date) {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: SP_TZ,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date).replace(' ', 'T');
}

function nowSP() { return formatSP(new Date()); }

function daysPlusSP(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatSP(d);
}

function dbToLocal(isoStr) {
    if (!isoStr) return '';
    // The DB value might come without timezone (assumed server=SP)
    // Treat as UTC to convert properly
    return formatSP(new Date(isoStr));
}

// ── Componente ────────────────────────────────────────────────────────────────
const NEW_FORM = () => ({
    business_id: '', type: 'card', title: '', subtitle: '',
    sort_order: 0, active: true,
    starts_at: nowSP(), ends_at: daysPlusSP(30),
});

export default function AdminDestaques() {
    const [highlights, setHighlights] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(NEW_FORM());
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => api.get('/admin/highlights').then(r => setHighlights(r.data));
    useEffect(() => {
        load();
        api.get('/admin/businesses?status=active&limit=200').then(r => setBusinesses(r.data.businesses || []));
    }, []);

    const open = (h) => {
        setAlert(null);
        if (h) {
            // Editando — pré-preenche com dados existentes no fuso de SP
            setForm({
                business_id: h.business_id,
                type: h.type,
                title: h.title || '',
                subtitle: h.subtitle || '',
                sort_order: h.sort_order || 0,
                active: !!h.active,
                starts_at: dbToLocal(h.starts_at) || nowSP(),
                ends_at: dbToLocal(h.ends_at) || daysPlusSP(30),
            });
            setEditing(h);
        } else {
            // Novo — datas padrão em SP
            setForm(NEW_FORM());
            setEditing('new');
        }
    };

    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.business_id) return setAlert({ type: 'error', msg: 'Selecione um negócio.' });
        setSaving(true);
        try {
            const payload = {
                ...form,
                // Envia datas sem timezone — servidor SP interpreta corretamente
                starts_at: form.starts_at || null,
                ends_at: form.ends_at || null,
            };
            if (editing === 'new') await api.post('/admin/highlights', payload);
            else await api.put(`/admin/highlights/${editing.id}`, payload);
            setAlert({ type: 'success', msg: 'Destaque salvo!' });
            setEditing(null);
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || err.message });
        } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!window.confirm('Remover destaque?')) return;
        await api.delete(`/admin/highlights/${id}`);
        load();
    };

    const carousels = highlights.filter(h => h.type === 'carousel');
    const cards = highlights.filter(h => h.type === 'card');

    function HItem({ h }) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {h.logo && <img src={h.logo} alt="" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title || h.business_name}</div>
                    {h.subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{h.subtitle}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${h.active ? 'badge-success' : 'badge-warning'}`}>{h.active ? 'Ativo' : 'Inativo'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordem: {h.sort_order}</span>
                        {h.ends_at && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Expira: {dbToLocal(h.ends_at).replace('T', ' ')}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => open(h)}><span className="material-icons-round" style={{ fontSize: 16 }}>edit</span></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(h.id)}><span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span></button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div><h1>Destaques</h1><p>Gerencie o carrossel e os cards rotativos da página inicial</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => open(null)}>
                    <span className="material-icons-round">add</span> Novo destaque
                </button>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <section style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎠 Carrossel Hero ({carousels.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {carousels.map(h => <HItem key={h.id} h={h} />)}
                    {carousels.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum item no carrossel. Os itens do carrossel aparecem no hero da homepage.</p>}
                </div>
            </section>

            <section>
                <h3 style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⭐ Cards de Destaque ({cards.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cards.map(h => <HItem key={h.id} h={h} />)}
                    {cards.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum card de destaque cadastrado.</p>}
                </div>
            </section>

            {/* Modal */}
            {editing !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={e => e.target === e.currentTarget && setEditing(null)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2>{editing === 'new' ? '+ Novo Destaque' : 'Editar Destaque'}</h2>
                            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><span className="material-icons-round">close</span></button>
                        </div>

                        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 12 }}><span className="material-icons-round">{alert.type === 'error' ? 'error' : 'check'}</span>{alert.msg}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Negócio */}
                            <div className="form-group">
                                <label className="form-label">Negócio *</label>
                                <select className="form-select" value={form.business_id} onChange={e => setF('business_id', e.target.value)}>
                                    <option value="">Selecione o negócio...</option>
                                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* Tipo + Ordem */}
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select className="form-select" value={form.type} onChange={e => setF('type', e.target.value)}>
                                        <option value="card">Card rotativo</option>
                                        <option value="carousel">🎠 Carrossel Hero</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ordem de exibição</label>
                                    <input type="number" className="form-input" value={form.sort_order} onChange={e => setF('sort_order', parseInt(e.target.value) || 0)} min={0} />
                                </div>
                            </div>

                            {/* Título + Subtítulo */}
                            <div className="form-group">
                                <label className="form-label">Título (opcional — exibido sobre o banner)</label>
                                <input className="form-input" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Ex: Melhor Pizzaria da Cidade" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtítulo</label>
                                <input className="form-input" value={form.subtitle} onChange={e => setF('subtitle', e.target.value)} placeholder="Ex: Entregas em toda a região" />
                            </div>

                            {/* Datas */}
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Início <small style={{ color: 'var(--text-muted)' }}>(fuso SP)</small></label>
                                    <input type="datetime-local" className="form-input" value={form.starts_at} onChange={e => setF('starts_at', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fim <small style={{ color: 'var(--text-muted)' }}>(fuso SP • vazio = sem expiração)</small></label>
                                    <input type="datetime-local" className="form-input" value={form.ends_at} onChange={e => setF('ends_at', e.target.value)} />
                                    {form.ends_at && <button type="button" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }} onClick={() => setF('ends_at', '')}>✕ Remover data de expiração</button>}
                                </div>
                            </div>

                            {/* Ativo toggle */}
                            <label className="toggle-switch">
                                <input type="checkbox" checked={form.active} onChange={e => setF('active', e.target.checked)} />
                                <span className="toggle-track"><span className="toggle-thumb" /></span>
                                <span className="toggle-label" style={{ color: form.active ? 'var(--success)' : 'var(--danger)' }}>
                                    {form.active ? 'Destaque ativo (visível na home)' : 'Destaque inativo (oculto)'}
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
