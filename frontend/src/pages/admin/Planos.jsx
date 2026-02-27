import { useState, useEffect } from 'react';
import api from '../../services/api';

const ALL_FEATURES = [
    { key: 'gallery', label: '🖼️ Galeria de fotos', desc: 'Upload de múltiplas fotos do negócio' },
    { key: 'maps', label: '📍 Mapa (Google Maps)', desc: 'Exibe localização do negócio no mapa' },
    { key: 'social_extended', label: '📲 Redes sociais ilimitadas', desc: 'Adicionar múltiplas redes sociais' },
    { key: 'highlights', label: '⭐ Destaque no carrossel', desc: 'Aparece no carrossel da página inicial' },
];

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const EMPTY = { name: '', slug: '', description: '', price: '0', features: [], highlight: false, active: true, sort_order: '0', contact_link: '' };

export default function AdminPlanos() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | plan object
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/admin/plans').then(r => setPlans(r.data)).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => { setForm(EMPTY); setModal('create'); setAlert(null); };
    const openEdit = (p) => {
        const features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
        setForm({ ...p, features, price: String(p.price), sort_order: String(p.sort_order) });
        setModal(p);
        setAlert(null);
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const toggleFeature = (key) => {
        setForm(f => ({
            ...f,
            features: f.features.includes(key) ? f.features.filter(x => x !== key) : [...f.features, key],
        }));
    };

    const save = async () => {
        if (!form.name) return setAlert({ type: 'error', msg: 'Nome obrigatório.' });
        setSaving(true);
        try {
            const payload = { ...form, slug: form.slug || slugify(form.name), price: parseFloat(form.price) || 0, sort_order: parseInt(form.sort_order) || 0 };
            if (modal === 'create') {
                await api.post('/admin/plans', payload);
            } else {
                await api.put(`/admin/plans/${modal.id}`, payload);
            }
            setModal(null);
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || err.message });
        } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!window.confirm('Excluir este plano?')) return;
        await api.delete(`/admin/plans/${id}`);
        load();
    };

    const featureLabel = (key) => ALL_FEATURES.find(f => f.key === key)?.label || key;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Planos</h1>
                    <p>Configure os planos disponíveis e os recursos liberados para cada um</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <span className="material-icons-round">add</span> Novo Plano
                </button>
            </div>

            {loading ? <div className="page-loading"><div className="spinner" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {plans.map(p => {
                        const features = typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || []);
                        return (
                            <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${p.highlight ? 'var(--primary)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-xl)', padding: 24, position: 'relative' }}>
                                {p.highlight && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ DESTAQUE</div>}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                                        <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{p.slug}</code>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><span className="material-icons-round" style={{ fontSize: 16 }}>edit</span></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => remove(p.id)} style={{ color: 'var(--danger)' }}><span className="material-icons-round" style={{ fontSize: 16 }}>delete</span></button>
                                    </div>
                                </div>

                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-light)', marginBottom: 8 }}>
                                    {parseFloat(p.price) === 0 ? 'Grátis' : `R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}`}
                                    {parseFloat(p.price) > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span>}
                                </div>

                                {p.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12. }}>{p.description}</p>}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {features.length === 0
                                        ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem recursos extras</span>
                                        : features.map(f => (
                                            <span key={f} style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--primary-light)', borderRadius: 20, padding: '2px 10px' }}>
                                                {featureLabel(f)}
                                            </span>
                                        ))}
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    <span className={`badge ${p.active ? 'badge-success' : 'badge-warning'}`}>{p.active ? 'Ativo' : 'Inativo'}</span>
                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Ordem #{p.sort_order}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modal !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: 20 }}>{modal === 'create' ? '+ Novo Plano' : `Editar: ${modal.name}`}</h2>

                        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}><span className="material-icons-round">{alert.type === 'error' ? 'error' : 'check'}</span>{alert.msg}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Nome *</label>
                                    <input className="form-input" value={form.name} onChange={e => { set('name', e.target.value); if (!form.slug || modal === 'create') set('slug', slugify(e.target.value)); }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Slug (URL)</label>
                                    <input className="form-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="ex: basico" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Breve descrição exibida na página pública" />
                            </div>

                            <div className="form-grid cols-3">
                                <div className="form-group">
                                    <label className="form-label">Preço (R$)</label>
                                    <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ordem de exibição</label>
                                    <input className="form-input" type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Link de contato</label>
                                    <input className="form-input" value={form.contact_link || ''} onChange={e => set('contact_link', e.target.value)} placeholder="https://wa.me/..." />
                                </div>
                            </div>

                            {/* Recursos */}
                            <div>
                                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Recursos incluídos</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {ALL_FEATURES.map(f => (
                                        <label key={f.key} className="toggle-switch" style={{ gap: 14 }}>
                                            <input type="checkbox" checked={form.features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
                                            <span className="toggle-track"><span className="toggle-thumb" /></span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Opções */}
                            <div style={{ display: 'flex', gap: 24 }}>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={form.highlight} onChange={e => set('highlight', e.target.checked)} />
                                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                                    <span className="toggle-label" style={{ color: form.highlight ? 'var(--accent)' : 'var(--text-muted)' }}>⭐ Destaque</span>
                                </label>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                                    <span className="toggle-label" style={{ color: form.active ? 'var(--success)' : 'var(--danger)' }}>{form.active ? 'Ativo' : 'Inativo'}</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar plano</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
