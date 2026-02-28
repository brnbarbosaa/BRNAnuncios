import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const DEFAULT_FORM = {
    title: '', subtitle: '', image_url: '', link_url: '',
    sort_order: 0, active: true
};

export default function AdminCarousel() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'new' | {id,...}
    const [form, setForm] = useState(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/carousels');
            setItems(res.data);
        } catch (err) { }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openNew = () => {
        setForm(DEFAULT_FORM);
        setModal('new');
    };

    const openEdit = (item) => {
        setForm({
            title: item.title || '',
            subtitle: item.subtitle || '',
            image_url: item.image_url || '',
            link_url: item.link_url || '',
            sort_order: item.sort_order || 0,
            active: !!item.active
        });
        setModal(item);
    };

    const save = async (e) => {
        e.preventDefault();
        if (!form.image_url) {
            alert('A imagem é obrigatória.');
            return;
        }
        setSaving(true);
        try {
            if (modal?.id) {
                await api.put(`/admin/carousels/${modal.id}`, form);
            } else {
                await api.post('/admin/carousels', form);
            }
            setModal(null);
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao salvar carrossel.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Tem certeza que deseja apagar este item permanentemente?')) return;
        try {
            await api.delete(`/admin/carousels/${id}`);
            load();
        } catch (err) {
            alert('Erro ao excluir.');
        }
    };

    const toggleStatus = async (item) => {
        try {
            await api.put(`/admin/carousels/${item.id}`, { ...item, active: !item.active });
            load();
        } catch (err) { alert('Erro ao alterar status'); }
    }

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🖼️ Carrossel</h1>
                    <p>Crie e organize as capas principais da página inicial</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <span className="material-icons-round">add</span>
                    Novo Slide
                </button>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-muted)' }}>view_carousel</span>
                    <p>Nenhum slide cadastrado ainda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {items.map(item => (
                        <div key={item.id} style={{
                            background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${item.active ? 'rgba(16,185,129,0.3)' : 'var(--border-light)'}`,
                            display: 'flex', gap: 16, alignItems: 'center'
                        }}>
                            <div style={{
                                width: 140, height: 70, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                background: 'var(--bg-surface)', flexShrink: 0
                            }}>
                                <img src={item.image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '1rem', color: item.active ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {item.title || '(Sem Titulo)'}
                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>Ordem: {item.sort_order}</span>
                                </div>
                                {(item.subtitle || item.link_url) && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        {item.subtitle && <span>{item.subtitle}</span>}
                                        {item.link_url && <span>🔗 {item.link_url.substring(0, 30)}...</span>}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-sm" style={{
                                    background: item.active ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)',
                                    color: item.active ? 'var(--success)' : 'var(--text-muted)'
                                }} onClick={() => toggleStatus(item)} title={item.active ? 'Desativar' : 'Ativar'}>
                                    <span className="material-icons-round" style={{ fontSize: 18 }}>
                                        {item.active ? 'toggle_on' : 'toggle_off'}
                                    </span>
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                                    <span className="material-icons-round" style={{ fontSize: 18 }}>edit</span>
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)} style={{ color: 'var(--danger)' }}>
                                    <span className="material-icons-round" style={{ fontSize: 18 }}>delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Novo/Edit */}
            {modal && (
                <div className="modal-overlay" onClick={() => !saving && setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>{modal === 'new' ? 'Novo Carrossel' : 'Editar Carrossel'}</h2>
                            <button className="btn-close" onClick={() => setModal(null)}><span className="material-icons-round">close</span></button>
                        </div>
                        <form onSubmit={save}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                <div className="form-group">
                                    <label>URL da Imagem Banner *</label>
                                    <input type="url" className="form-control" required placeholder="https://..."
                                        value={form.image_url} onChange={e => set(e.target.value)} />
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Recomendado imagens largas ex: 1400x400px</small>
                                </div>
                                {form.image_url && (
                                    <div style={{ width: '100%', height: 100, borderRadius: 8, background: '#000', overflow: 'hidden' }}>
                                        <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="Preview" />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label>Título (Opcional)</label>
                                        <input type="text" className="form-control" placeholder="Título sobre a imagem"
                                            value={form.title} onChange={e => set('title', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Subtítulo (Opcional)</label>
                                        <input type="text" className="form-control" placeholder="Breve texto"
                                            value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Link de Destino (Opcional)</label>
                                    <input type="url" className="form-control" placeholder="https://..."
                                        value={form.link_url} onChange={e => set('link_url', e.target.value)} />
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Para onde o usuário vai ao clicar na imagem</small>
                                </div>

                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div className="form-group" style={{ width: 120, marginBottom: 0 }}>
                                        <label>Ordem (0=topo)</label>
                                        <input type="number" className="form-control" min={0}
                                            value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 18 }}>
                                        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                                        Ativo no site
                                    </label>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Salvando...' : 'Salvar Carrossel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
