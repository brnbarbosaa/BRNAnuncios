import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';
import SocialIcon, { SOCIAL_LABELS, SOCIAL_PLATFORMS as PLATFORMS_LIST } from '../../components/SocialIcons';

// ── Definido FORA do componente ──────────────────────────────
function Section({ title, icon, children, accent }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${accent || 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1rem', paddingBottom: 12, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon && <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--primary-light)' }}>{icon}</span>}
                {title}
            </h3>
            {children}
        </div>
    );
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const PLAN_DISPLAY = {
    free: { label: '🆓 Gratuito', color: 'var(--text-muted)', bg: 'var(--bg-surface)' },
    basic: { label: '⭐ Básico', color: 'var(--accent)', bg: 'rgba(245,158,11,0.12)' },
    premium: { label: '💎 Premium', color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.12)' },
};

export default function AdminAnuncioEdit() {
    const { id } = useParams();
    const isNew = id === 'novo';
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [socialLinks, setSocialLinks] = useState([]);

    const [form, setForm] = useState({ name: '', user_id: '', category_id: '', category_observation: '', short_description: '', description: '', phone: '', whatsapp: '', email: '', website: '', instagram: '', facebook: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '', tags: '', status: 'active', plan: 'free', featured: false });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [tab, setTab] = useState('info'); // 'info' | 'contact' | 'address' | 'owner'

    useEffect(() => {
        api.get('/admin/categories').then(r => setCategories(r.data));
        api.get('/admin/users?role=client&limit=200').then(r => setUsers(r.data.users || []));
        if (!isNew) {
            api.get(`/admin/businesses/${id}`).then(r => {
                const b = r.data.business;
                setForm({ name: b.name || '', user_id: b.user_id || '', category_id: b.category_id || '', category_observation: b.category_observation || '', short_description: b.short_description || '', description: b.description || '', phone: b.phone || '', whatsapp: b.whatsapp || '', email: b.email || '', website: b.website || '', instagram: b.instagram || '', facebook: b.facebook || '', street: b.street || '', number: b.number || '', complement: b.complement || '', neighborhood: b.neighborhood || '', city: b.city || '', state: b.state || '', zip_code: b.zip_code || '', tags: b.tags || '', status: b.status || 'active', plan: b.plan || 'free', featured: !!b.featured });
                // Parse social links
                const sl = Array.isArray(b.social_links) ? b.social_links :
                    typeof b.social_links === 'string' ? (() => { try { return JSON.parse(b.social_links); } catch { return []; } })() : [];
                setSocialLinks(sl);
                // Load owner data
                if (b.user_id) loadOwner(b.user_id);
            }).finally(() => setLoading(false));
        }
    }, [id]);

    const loadOwner = async (userId) => {
        try {
            const r = await api.get(`/admin/users?limit=1&search=${userId}`);
            const found = (r.data.users || []).find(u => u.id === parseInt(userId));
            if (found) setOwnerInfo(found);
        } catch { }
    };

    useEffect(() => {
        if (form.user_id && !ownerInfo) loadOwner(form.user_id);
    }, [form.user_id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inp = (k, type = 'text') => ({ value: form[k], onChange: e => set(k, e.target.value), className: 'form-input', type });

    // Social links
    const addSocialLink = () => setSocialLinks(l => [...l, { platform: '', url: '' }]);
    const updateSocialLink = (index, field, value) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = value;
        setSocialLinks(newLinks);
    };
    const removeSocialLink = (idx) => setSocialLinks(l => l.filter((_, i) => i !== idx));

    const saveUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setAlert(null);
        try {
            await api.put(`/admin/users/${ownerInfo.id}`, ownerInfo);
            setAlert({ type: 'success', msg: 'Usuário atualizado com sucesso!' });
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Erro ao atualizar usuário.' });
        } finally {
            setSaving(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, social_links: socialLinks };
            if (isNew) {
                const r = await api.post('/admin/businesses', payload);
                setAlert({ type: 'success', msg: 'Negócio criado!' });
                navigate(`/admin/anuncios/${r.data.id}`);
            } else {
                await api.put(`/admin/businesses/${id}`, payload);
                setAlert({ type: 'success', msg: '✅ Negócio salvo com sucesso.' });
            }
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    const pd = PLAN_DISPLAY[form.plan] || PLAN_DISPLAY.free;

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/anuncios')}>
                        <span className="material-icons-round" style={{ fontSize: 16 }}>arrow_back</span>
                    </button>
                    <div>
                        <h1>{isNew ? 'Novo Anúncio' : form.name || 'Editar Anúncio'}</h1>
                        {!isNew && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ID: {id}</p>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="badge" style={{ background: pd.bg, color: pd.color, padding: '4px 14px', fontWeight: 700 }}>{pd.label}</span>
                    <button className="btn btn-primary" onClick={submit} disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                    </button>
                </div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            {/* Abas */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-light)', marginBottom: 20 }}>
                {(() => {
                    const TABS = [
                        { id: 'info', label: 'Informações', icon: 'article' },
                        { id: 'contact', label: 'Contato & Redes', icon: 'contact_phone' },
                        { id: 'address', label: 'Endereço', icon: 'place' },
                        { id: 'owner', label: 'Proprietário & Usuário', icon: 'manage_accounts' }
                    ];
                    return TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 18px', border: 'none', cursor: 'pointer',
                            background: 'transparent',
                            color: tab === t.id ? 'var(--primary-light)' : 'var(--text-muted)',
                            fontWeight: tab === t.id ? 700 : 500, fontSize: '0.85rem',
                            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s',
                        }}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ));
                })()}
            </div>

            <form onSubmit={submit}>
                {/* ── TAB: Informações ── */}
                {tab === 'info' && (
                    <>
                        <Section title="Informações Básicas" icon="store">
                            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                                <div className="form-group"><label className="form-label">Nome *</label><input {...inp('name')} placeholder="Nome do negócio" required /></div>
                                <div className="form-group">
                                    <label className="form-label">Categoria</label>
                                    <select className="form-select" value={form.category_id} onChange={e => {
                                        set('category_id', e.target.value);
                                        if (e.target.value !== 'outros-id') set('category_observation', '');
                                    }}>
                                        <option value="">Sem categoria</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {/* Mostrar observation se for Outros ou se tiver algo preenchido */}
                                    {(categories.find(c => c.id === parseInt(form.category_id))?.slug === 'outros' || form.category_observation) && (
                                        <div style={{ marginTop: 8 }}>
                                            <input {...inp('category_observation')} placeholder="Especifique a categoria (Outros)..." style={{ borderLeft: '3px solid var(--accent)' }} />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Opcional: Cliente preenche quando não encontra a categoria dele.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 12 }}><label className="form-label">Descrição curta</label><input {...inp('short_description')} placeholder="Até 300 caracteres" maxLength={300} /></div>
                            <div className="form-group"><label className="form-label">Descrição completa</label><textarea value={form.description} onChange={e => set('description', e.target.value)} className="form-textarea" rows={5} maxLength={2500} placeholder="Descrição detalhada..." />
                                <div style={{ fontSize: '0.72rem', color: form.description?.length > 2400 ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                                    {form.description?.length || 0} / 2500 max
                                </div>
                            </div>
                        </Section>

                        <Section title="Status e Plano" icon="settings">
                            <div className="form-grid cols-3">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                                        <option value="active">✅ Ativo</option>
                                        <option value="inactive">⏸️ Inativo</option>
                                        <option value="pending">⏳ Pendente</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Plano</label>
                                    <select className="form-select" value={form.plan} onChange={e => set('plan', e.target.value)} style={{ borderColor: pd.color }}>
                                        <option value="free">🆓 Gratuito</option>
                                        <option value="basic">⭐ Básico</option>
                                        <option value="premium">💎 Premium</option>
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
                        </Section>

                        <Section title="Tags / Palavras-chave" icon="sell">
                            <div className="form-group">
                                <label className="form-label">Separadas por vírgula</label>
                                <input {...inp('tags')} placeholder="pizza, delivery, restaurante, italiano..." />
                            </div>
                        </Section>
                    </>
                )}

                {/* ── TAB: Contato & Redes Sociais ── */}
                {tab === 'contact' && (
                    <>
                        <Section title="Contato" icon="call">
                            <div className="form-grid cols-3" style={{ marginBottom: 16 }}>
                                <div className="form-group"><label className="form-label">Telefone</label><input {...phoneInputProps(form.phone, v => setForm(f => ({ ...f, phone: v })))} /></div>
                                <div className="form-group"><label className="form-label">WhatsApp</label><input {...phoneInputProps(form.whatsapp, v => setForm(f => ({ ...f, whatsapp: v })))} /></div>
                                <div className="form-group"><label className="form-label">E-mail</label><input {...inp('email', 'email')} placeholder="contato@..." /></div>
                            </div>
                        </Section>

                        <Section title="Redes Sociais" icon="share">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                                {socialLinks.map((link, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {link.platform && <SocialIcon platform={link.platform} size={20} />}
                                        <select className="form-select" value={link.platform} onChange={e => updateSocialLink(idx, 'platform', e.target.value)}
                                            style={{ width: 160, flexShrink: 0 }}>
                                            <option value="">Selecione...</option>
                                            {PLATFORMS_LIST.map(key => (
                                                <option key={key} value={key}>{SOCIAL_LABELS[key]}</option>
                                            ))}
                                        </select>
                                        <input className="form-input" value={link.url} onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                                            placeholder="Link / @usuario" style={{ flex: 1 }} />
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSocialLink(idx)}
                                            style={{ color: 'var(--danger)', flexShrink: 0 }}>
                                            <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={addSocialLink}>
                                <span className="material-icons-round" style={{ fontSize: 16 }}>add</span>
                                Adicionar rede social
                            </button>
                        </Section>

                        {/* Redes antigas (legado) */}
                        {(form.instagram || form.facebook || form.website) && (
                            <Section title="Redes Sociais (legado)" icon="history">
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Campos antigos — migre para o sistema de redes sociais acima.
                                </p>
                                <div className="form-grid cols-3">
                                    <div className="form-group"><label className="form-label">Website</label><input {...inp('website')} placeholder="https://..." /></div>
                                    <div className="form-group"><label className="form-label">Instagram</label><input {...inp('instagram')} placeholder="@usuario" /></div>
                                    <div className="form-group"><label className="form-label">Facebook</label><input {...inp('facebook')} placeholder="Link da página" /></div>
                                </div>
                            </Section>
                        )}
                    </>
                )}

                {/* ── TAB: Endereço ── */}
                {tab === 'address' && (
                    <Section title="Endereço" icon="place">
                        <div className="form-grid cols-3">
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Rua</label><input {...inp('street')} placeholder="Rua / Avenida" /></div>
                            <div className="form-group"><label className="form-label">Número</label><input {...inp('number')} placeholder="123" /></div>
                            <div className="form-group"><label className="form-label">Complemento</label><input {...inp('complement')} /></div>
                            <div className="form-group"><label className="form-label">Bairro</label><input {...inp('neighborhood')} /></div>
                            <div className="form-group"><label className="form-label">Cidade</label><input {...inp('city')} /></div>
                            <div className="form-group">
                                <label className="form-label">Estado</label>
                                <select className="form-select" value={form.state} onChange={e => set('state', e.target.value)}>
                                    <option value="">UF</option>
                                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">CEP</label><input {...inp('zip_code')} placeholder="00000-000" /></div>
                        </div>
                    </Section>
                )}

                {/* ── TAB: Proprietário ── */}
                {tab === 'owner' && (
                    <>
                        <Section title="Proprietário do Anúncio" icon="person">
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Selecionar cliente</label>
                                <select className="form-select" value={form.user_id} onChange={e => { set('user_id', e.target.value); loadOwner(e.target.value); }} required>
                                    <option value="">Selecione o proprietário</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                        </Section>

                        {/* Dados do proprietário selecionado */}
                        {ownerInfo && (
                            <Section title="Informações do Cliente (Usuário)" icon="manage_accounts" accent="rgba(99,102,241,0.3)">
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '14px 24px', marginBottom: 20 }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Nome do Cliente</label>
                                        <input className="form-input" value={ownerInfo.name} onChange={e => setOwnerInfo({ ...ownerInfo, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>E-mail de acesso</label>
                                        <input className="form-input" type="email" value={ownerInfo.email} onChange={e => setOwnerInfo({ ...ownerInfo, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Telefone do Cliente</label>
                                        <input {...phoneInputProps(ownerInfo.phone || '', v => setOwnerInfo({ ...ownerInfo, phone: v }))} placeholder="Telefone do associado" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status de Acesso</label>
                                        <select className="form-select" value={ownerInfo.active ? '1' : '0'} onChange={e => setOwnerInfo({ ...ownerInfo, active: e.target.value === '1' })}>
                                            <option value="1">✅ Ativo no Painel Cliente</option>
                                            <option value="0">❌ Inativo (Não consegue logar)</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Função</div>
                                        <span className="badge" style={{ background: ownerInfo.role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: ownerInfo.role === 'admin' ? 'var(--danger)' : 'var(--info)' }}>
                                            {ownerInfo.role === 'admin' ? 'Administrador' : 'Cliente'}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cadastro</div>
                                        <div>{ownerInfo.created_at ? new Date(ownerInfo.created_at).toLocaleDateString('pt-BR') : '—'}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>ID do Usuário</div>
                                        <div style={{ color: 'var(--text-muted)' }}>#{ownerInfo.id}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={saveUser} disabled={saving}>
                                        {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><span className="material-icons-round" style={{ fontSize: 16 }}>save</span> Salvar Dados do Usuário</>}
                                    </button>
                                </div>
                            </Section>
                        )}

                        {!ownerInfo && form.user_id && (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                                <p>Carregando dados do proprietário...</p>
                            </div>
                        )}

                        {!form.user_id && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <span className="material-icons-round" style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>person_search</span>
                                <p>Selecione um proprietário acima para ver seus dados.</p>
                            </div>
                        )}
                    </>
                )}
            </form>
        </div>
    );
}
