import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDestaques() {
    const [highlights, setHighlights] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ business_id: '', type: 'card', title: '', subtitle: '', sort_order: 0, active: true, starts_at: '', ends_at: '' });
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => api.get('/admin/highlights').then(r => setHighlights(r.data));
    useEffect(() => {
        load();
        api.get('/admin/businesses?status=active&limit=200').then(r => setBusinesses(r.data.businesses || []));
    }, []);

    const open = (h) => {
        setEditing(h || 'new');
        setForm(h ? { business_id: h.business_id, type: h.type, title: h.title || '', subtitle: h.subtitle || '', sort_order: h.sort_order || 0, active: !!h.active, starts_at: h.starts_at || '', ends_at: h.ends_at || '' } : { business_id: '', type: 'card', title: '', subtitle: '', sort_order: 0, active: true, starts_at: '', ends_at: '' });
    };

    const save = async () => {
        setSaving(true);
        try {
            if (editing === 'new') await api.post('/admin/highlights', form);
            else await api.put(`/admin/highlights/${editing.id}`, form);
            setAlert({ type: 'success', msg: 'Destaque salvo.' }); setEditing(null); load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!window.confirm('Remover destaque?')) return;
        await api.delete(`/admin/highlights/${id}`); load();
    };

    const carousels = highlights.filter(h => h.type === 'carousel');
    const cards = highlights.filter(h => h.type === 'card');

    const HList = ({ items, title }) => (
        <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title} ({items.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(h => (
                    <div key={h.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        {h.logo && <img src={h.logo} alt="" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title || h.business_name}</div>
                            {h.subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{h.subtitle}</div>}
                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                <span className={`badge ${h.active ? 'badge-active' : 'badge-inactive'}`}>{h.active ? 'Ativo' : 'Inativo'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordem: {h.sort_order}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => open(h)}><span className="material-icons-round" style={{ fontSize: 16 }}>edit</span></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => remove(h.id)}><span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum destaque nesta categoria.</p>}
            </div>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div><h1>Destaques</h1><p>Gerencie o carrossel e os cards rotativos</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => open(null)}><span className="material-icons-round">add</span> Novo destaque</button>
            </div>
            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>{alert.msg}</div>}
            <HList items={carousels} title="🎠 Carrossel" />
            <HList items={cards} title="⭐ Cards de Destaque" />

            {editing && (
                <div className="modal-overlay" onClick={() => setEditing(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing === 'new' ? 'Novo Destaque' : 'Editar Destaque'}</h3><button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><span className="material-icons-round">close</span></button></div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group"><label className="form-label">Negócio *</label>
                                <select className="form-select" value={form.business_id} onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}>
                                    <option value="">Selecione o negócio</option>
                                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="form-grid cols-2">
                                <div className="form-group"><label className="form-label">Tipo</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                        <option value="card">Card rotativo</option>
                                        <option value="carousel">Carrossel</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Ordem</label><input type="number" className="form-input" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} min={0} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Título (opcional)</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Será exibido sobre o banner" /></div>
                            <div className="form-group"><label className="form-label">Subtítulo</label><input className="form-input" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
                            <div className="form-grid cols-2">
                                <div className="form-group"><label className="form-label">Início</label><input type="datetime-local" className="form-input" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Fim</label><input type="datetime-local" className="form-input" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /><span>Destaque ativo</span></label>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
