import { useState, useEffect } from 'react';
import api from '../../services/api';

const slugify = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const EMPTY = {
    name: '', slug: '', description: '', price: '0', price_promo: '',
    features: [], highlight: false, active: true, sort_order: '0', contact_link: '',
};

export default function AdminPlanos() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [featureInput, setFeatureInput] = useState('');

    const load = () => {
        setLoading(true);
        api.get('/admin/plans').then(r => setPlans(r.data)).finally(() => setLoading(false));
    };
    useEffect(load, []);

    const openCreate = () => { setForm(EMPTY); setFeatureInput(''); setModal('create'); setAlert(null); };
    const openEdit = (p) => {
        const features = typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || []);
        setForm({ ...p, features, price: String(p.price || 0), price_promo: p.price_promo ? String(p.price_promo) : '', sort_order: String(p.sort_order || 0) });
        setFeatureInput('');
        setModal(p);
        setAlert(null);
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // ── Features por texto livre ─────────────────────────────────────────────
    const features = form.features || [];

    const addFeature = () => {
        const t = featureInput.trim();
        if (!t) return;
        set('features', [...features, t]);
        setFeatureInput('');
    };

    const removeFeature = (i) => set('features', features.filter((_, idx) => idx !== i));

    const onFeatureKey = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addFeature(); }
    };

    const save = async () => {
        if (!form.name) return setAlert({ type: 'error', msg: 'Nome obrigatório.' });
        setSaving(true);
        try {
            const payload = {
                ...form,
                slug: form.slug || slugify(form.name),
                price: parseFloat(form.price) || 0,
                price_promo: form.price_promo ? parseFloat(form.price_promo) : null,
                sort_order: parseInt(form.sort_order) || 0,
            };
            if (modal === 'create') await api.post('/admin/plans', payload);
            else await api.put(`/admin/plans/${modal.id}`, payload);
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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Planos</h1>
                    <p>Configure os planos e os recursos descritos em cada um</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <span className="material-icons-round">add</span> Novo Plano
                </button>
            </div>

            {loading ? <div className="page-loading"><div className="spinner" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {plans.map(p => {
                        const feats = typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || []);
                        const hasPromo = p.price_promo && parseFloat(p.price_promo) > 0;
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

                                {/* Preço */}
                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)', marginBottom: 8 }}>
                                    {parseFloat(p.price) === 0 && !hasPromo ? 'Grátis' : hasPromo ? (
                                        <span>
                                            <span style={{ textDecoration: 'line-through', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                                R$ {parseFloat(p.price).toFixed(2).replace('.', ',')}
                                            </span>
                                            {' R$ '}{parseFloat(p.price_promo).toFixed(2).replace('.', ',')}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span>
                                        </span>
                                    ) : (
                                        <>R$ {parseFloat(p.price).toFixed(2).replace('.', ',')}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span></>
                                    )}
                                </div>

                                {p.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{p.description}</p>}

                                {/* Features como texto simples */}
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                                    {feats.length === 0
                                        ? <li style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem recursos extras</li>
                                        : feats.map((f, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                <span className="material-icons-round" style={{ fontSize: 15, color: 'var(--success)' }}>check_circle</span>
                                                {f}
                                            </li>
                                        ))}
                                </ul>

                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className={`badge ${p.active ? 'badge-success' : 'badge-warning'}`}>{p.active ? 'Ativo' : 'Inativo'}</span>
                                    {hasPromo && <span className="badge badge-warning">🏷️ Promoção</span>}
                                </div>
                            </div>
                        );
                    })}
                    {plans.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>Nenhum plano cadastrado.</p>}
                </div>
            )}

            {/* Modal */}
            {modal !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: 20 }}>{modal === 'create' ? '+ Novo Plano' : `Editar: ${modal.name}`}</h2>

                        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 12 }}><span className="material-icons-round">{alert.type === 'error' ? 'error' : 'check'}</span>{alert.msg}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Nome + Slug */}
                            <div className="form-grid cols-2">
                                <div className="form-group">
                                    <label className="form-label">Nome do plano *</label>
                                    <input className="form-input" value={form.name} onChange={e => { set('name', e.target.value); if (!form.slug || modal === 'create') set('slug', slugify(e.target.value)); }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Slug (URL)</label>
                                    <input className="form-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="ex: basico" />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="form-group">
                                <label className="form-label">Descrição resumida</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Frase exibida no card público do plano" />
                            </div>

                            {/* Preços */}
                            <div className="form-grid cols-3">
                                <div className="form-group">
                                    <label className="form-label">Preço (R$)</label>
                                    <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preço promocional <small style={{ color: 'var(--accent)', fontWeight: 600 }}>🏷️</small></label>
                                    <input className="form-input" type="number" min="0" step="0.01" value={form.price_promo} onChange={e => set('price_promo', e.target.value)} placeholder="Vazio = sem promo" />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Deixe vazio para não mostrar promoção</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ordem de exibição</label>
                                    <input className="form-input" type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
                                </div>
                            </div>

                            {/* Link de contato */}
                            <div className="form-group">
                                <label className="form-label">Link de contato / WhatsApp</label>
                                <input className="form-input" value={form.contact_link || ''} onChange={e => set('contact_link', e.target.value)} placeholder="https://wa.me/55... ou /solicitar-cadastro" />
                            </div>

                            {/* Recursos — texto livre */}
                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                                    Recursos incluídos no plano
                                    <small style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>— descreva livremente cada item</small>
                                </label>

                                {/* Lista de features */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                                            <span className="material-icons-round" style={{ fontSize: 15, color: 'var(--success)', flexShrink: 0 }}>check_circle</span>
                                            <span style={{ flex: 1, fontSize: '0.88rem' }}>{f}</span>
                                            <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                                <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Input de nova feature */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        className="form-input"
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={onFeatureKey}
                                        placeholder="Ex: Galeria de fotos ilimitada (Enter para adicionar)"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={addFeature} disabled={!featureInput.trim()}>
                                        <span className="material-icons-round">add</span>
                                    </button>
                                </div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                    Pressione Enter ou clique no + para adicionar cada recurso
                                </small>
                            </div>

                            {/* Opções */}
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={Boolean(form.highlight)} onChange={e => set('highlight', e.target.checked)} />
                                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                                    <span className="toggle-label" style={{ color: form.highlight ? 'var(--accent)' : 'var(--text-muted)' }}>⭐ Destaque (mais popular)</span>
                                </label>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={Boolean(form.active)} onChange={e => set('active', e.target.checked)} />
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
