import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminCategorias() {
    const [cats, setCats] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', icon: 'store', color: '#6366f1', active: true });
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => api.get('/admin/categories').then(r => setCats(r.data));
    useEffect(() => { load(); }, []);

    const open = (cat) => { setEditing(cat || 'new'); setForm(cat ? { name: cat.name, icon: cat.icon || 'store', color: cat.color || '#6366f1', active: !!cat.active } : { name: '', icon: 'store', color: '#6366f1', active: true }); };

    const save = async () => {
        setSaving(true);
        try {
            if (editing === 'new') await api.post('/admin/categories', form);
            else await api.put(`/admin/categories/${editing.id}`, form);
            setAlert({ type: 'success', msg: 'Categoria salva.' }); setEditing(null); load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!window.confirm('Excluir categoria? Os anúncios vinculados perderão a categoria.')) return;
        await api.delete(`/admin/categories/${id}`); load();
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Categorias</h1><p>Organize os anúncios por tipo de negócio</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => open(null)}><span className="material-icons-round">add</span> Nova categoria</button>
            </div>
            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>{alert.msg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {cats.map(c => (
                    <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-icons-round" style={{ color: c.color, fontSize: 26 }}>{c.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.business_count || 0} negócio(s)</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => open(c)}><span className="material-icons-round" style={{ fontSize: 16 }}>edit</span></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => remove(c.id)}><span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span></button>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <div className="modal-overlay" onClick={() => setEditing(null)}>
                    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing === 'new' ? 'Nova Categoria' : 'Editar Categoria'}</h3><button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><span className="material-icons-round">close</span></button></div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">Ícone (Material Icons)</label><input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="store, restaurant, school..." />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Preview: <span className="material-icons-round" style={{ color: form.color, fontSize: 18, verticalAlign: 'middle' }}>{form.icon}</span></small>
                            </div>
                            <div className="form-group"><label className="form-label">Cor</label><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 48, height: 38, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', cursor: 'pointer', background: 'transparent', padding: 2 }} /><input className="form-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#6366f1" style={{ flex: 1 }} /></div></div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /><span>Categoria ativa</span></label>
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
