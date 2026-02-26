import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminAnuncioEdit() {
    const { id } = useParams();
    const isNew = id === 'novo';
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', user_id: '', category_id: '', short_description: '', description: '', phone: '', whatsapp: '', email: '', website: '', instagram: '', facebook: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '', tags: '', status: 'active', plan: 'free', featured: false });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        api.get('/admin/categories').then(r => setCategories(r.data));
        api.get('/admin/users?role=client&limit=200').then(r => setUsers(r.data.users || []));
        if (!isNew) {
            api.get(`/admin/businesses/${id}`).then(r => {
                const b = r.data.business;
                setForm({ name: b.name || '', user_id: b.user_id || '', category_id: b.category_id || '', short_description: b.short_description || '', description: b.description || '', phone: b.phone || '', whatsapp: b.whatsapp || '', email: b.email || '', website: b.website || '', instagram: b.instagram || '', facebook: b.facebook || '', street: b.street || '', number: b.number || '', complement: b.complement || '', neighborhood: b.neighborhood || '', city: b.city || '', state: b.state || '', zip_code: b.zip_code || '', tags: b.tags || '', status: b.status || 'active', plan: b.plan || 'free', featured: !!b.featured });
            }).finally(() => setLoading(false));
        }
    }, [id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inp = (k, type = 'text') => ({ value: form[k], onChange: e => set(k, e.target.value), className: 'form-input', type });

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isNew) {
                const r = await api.post('/admin/businesses', form);
                setAlert({ type: 'success', msg: 'Negócio criado!' });
                navigate(`/admin/anuncios/${r.data.id}`);
            } else {
                await api.put(`/admin/businesses/${id}`, form);
                setAlert({ type: 'success', msg: 'Negócio salvo com sucesso.' });
            }
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    const Section = ({ title, children }) => (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1rem', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>{title}</h3>
            {children}
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div><h1>{isNew ? 'Novo Anúncio' : 'Editar Anúncio'}</h1></div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/admin/anuncios')}>Cancelar</button>
                    <button className="btn btn-primary" onClick={submit} disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                    </button>
                </div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <form onSubmit={submit}>
                <Section title="📋 Informações Básicas">
                    <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                        <div className="form-group"><label className="form-label">Nome *</label><input {...inp('name')} placeholder="Nome do negócio" required /></div>
                        <div className="form-group">
                            <label className="form-label">Proprietário *</label>
                            <select className="form-select" value={form.user_id} onChange={e => set('user_id', e.target.value)} required>
                                <option value="">Selecione o usuário</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoria</label>
                            <select className="form-select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                                <option value="">Sem categoria</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                                <option value="pending">Pendente</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Plano</label>
                            <select className="form-select" value={form.plan} onChange={e => set('plan', e.target.value)}>
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <label className="form-label">Destaque</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                                <span style={{ fontSize: '0.9rem' }}>Marcar como destaque</span>
                            </label>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}><label className="form-label">Descrição curta</label><input {...inp('short_description')} placeholder="Até 300 caracteres" maxLength={300} /></div>
                    <div className="form-group"><label className="form-label">Descrição completa</label><textarea value={form.description} onChange={e => set('description', e.target.value)} className="form-textarea" rows={5} placeholder="Descrição detalhada..." /></div>
                </Section>

                <Section title="📞 Contato e Redes Sociais">
                    <div className="form-grid cols-3" style={{ marginBottom: 16 }}>
                        <div className="form-group"><label className="form-label">Telefone</label><input {...inp('phone')} placeholder="(11) 3333-4444" /></div>
                        <div className="form-group"><label className="form-label">WhatsApp</label><input {...inp('whatsapp')} placeholder="(11) 99999-9999" /></div>
                        <div className="form-group"><label className="form-label">E-mail</label><input {...inp('email', 'email')} placeholder="contato@..." /></div>
                        <div className="form-group"><label className="form-label">Website</label><input {...inp('website')} placeholder="https://..." /></div>
                        <div className="form-group"><label className="form-label">Instagram</label><input {...inp('instagram')} placeholder="@usuario" /></div>
                        <div className="form-group"><label className="form-label">Facebook</label><input {...inp('facebook')} placeholder="Link da página" /></div>
                    </div>
                </Section>

                <Section title="📍 Endereço">
                    <div className="form-grid cols-3">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Rua</label><input {...inp('street')} placeholder="Rua / Avenida" /></div>
                        <div className="form-group"><label className="form-label">Número</label><input {...inp('number')} placeholder="123" /></div>
                        <div className="form-group"><label className="form-label">Complemento</label><input {...inp('complement')} /></div>
                        <div className="form-group"><label className="form-label">Bairro</label><input {...inp('neighborhood')} /></div>
                        <div className="form-group"><label className="form-label">Cidade</label><input {...inp('city')} /></div>
                        <div className="form-group"><label className="form-label">Estado</label>
                            <select className="form-select" value={form.state} onChange={e => set('state', e.target.value)}>
                                <option value="">UF</option>
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">CEP</label><input {...inp('zip_code')} placeholder="00000-000" /></div>
                    </div>
                </Section>

                <Section title="🏷️ Tags">
                    <div className="form-group">
                        <label className="form-label">Palavras-chave (separadas por vírgula)</label>
                        <input {...inp('tags')} placeholder="pizza, delivery, restaurante, italiano..." />
                    </div>
                </Section>
            </form>
        </div>
    );
}
