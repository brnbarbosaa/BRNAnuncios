import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';

// ── Definido FORA do componente para evitar re-criação a cada render ──────────
// (se definido dentro, React recria o tipo a cada keystroke → perde o foco)
function Section({ title, children }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20 }}>
            <h3 style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border-light)', fontSize: '1rem' }}>{title}</h3>
            {children}
        </div>
    );
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function ClientMeuAnuncio() {
    const { user } = useAuth();
    const [business, setBusiness] = useState(null);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        Promise.all([
            api.get('/client/business'),
            api.get('/public/categories'),
        ]).then(([bRes, cRes]) => {
            const b = bRes.data.business;
            setBusiness(b);
            setCategories(cRes.data);
            setForm({
                name: b.name || '', category_id: b.category_id || '',
                short_description: b.short_description || '', description: b.description || '',
                phone: b.phone || '', whatsapp: b.whatsapp || '', email: b.email || '',
                website: b.website || '', instagram: b.instagram || '', facebook: b.facebook || '',
                street: b.street || '', number: b.number || '', complement: b.complement || '',
                neighborhood: b.neighborhood || '', city: b.city || '', state: b.state || '',
                zip_code: b.zip_code || '', tags: b.tags || '',
            });
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inp = (k) => ({ value: form[k] || '', onChange: e => set(k, e.target.value), className: 'form-input' });

    // ── Tags como chips ──────────────────────────────────────────────────────
    const tags = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const MAX_TAGS = 10;

    const addTag = (val) => {
        const t = val.trim().toLowerCase();
        if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
        set('tags', [...tags, t].join(','));
        setTagInput('');
    };

    const removeTag = (t) => set('tags', tags.filter(x => x !== t).join(','));

    const onTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/client/business', form);
            setAlert({ type: 'success', msg: '✅ Dados salvos com sucesso!' });
            window.scrollTo(0, 0);
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!business) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <span className="material-icons-round" style={{ fontSize: 60, display: 'block', marginBottom: 16 }}>store</span>
            <h3>Nenhum negócio vinculado</h3>
            <p style={{ marginTop: 8 }}>Entre em contato com o administrador.</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div><h1>Meu Anúncio</h1><p>Mantenha as informações do seu negócio atualizadas</p></div>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                    {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                </button>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <form onSubmit={save}>
                <Section title="📋 Informações Básicas">
                    <div className="form-grid cols-2" style={{ marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Nome do negócio</label>
                            <input {...inp('name')} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>🔒 O nome do estabelecimento não pode ser alterado.</small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoria</label>
                            <select className="form-select" value={form.category_id || ''} onChange={e => set('category_id', e.target.value)}>
                                <option value="">Selecione...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Descrição curta</label>
                        <input {...inp('short_description')} placeholder="Resumo em até 300 caracteres" maxLength={300} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descrição completa</label>
                        <textarea {...inp('description')} className="form-textarea" rows={5} placeholder="Conte tudo sobre o seu negócio..." />
                    </div>
                </Section>

                <Section title="📞 Contato e Redes Sociais">
                    <div className="form-grid cols-3">
                        <div className="form-group"><label className="form-label">Telefone</label><input {...phoneInputProps(form.phone, v => set('phone', v))} /></div>
                        <div className="form-group"><label className="form-label">WhatsApp</label><input {...phoneInputProps(form.whatsapp, v => set('whatsapp', v))} /></div>
                        <div className="form-group"><label className="form-label">E-mail</label><input {...inp('email')} type="email" placeholder="contato@..." /></div>
                        <div className="form-group"><label className="form-label">Website</label><input {...inp('website')} placeholder="https://..." /></div>
                        <div className="form-group"><label className="form-label">Instagram</label><input {...inp('instagram')} placeholder="@usuario" /></div>
                        <div className="form-group"><label className="form-label">Facebook</label><input {...inp('facebook')} placeholder="Link da página" /></div>
                    </div>
                </Section>

                <Section title="📍 Endereço">
                    <div className="form-grid cols-3">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Rua / Avenida</label><input {...inp('street')} /></div>
                        <div className="form-group"><label className="form-label">Número</label><input {...inp('number')} /></div>
                        <div className="form-group"><label className="form-label">Complemento</label><input {...inp('complement')} /></div>
                        <div className="form-group"><label className="form-label">Bairro</label><input {...inp('neighborhood')} /></div>
                        <div className="form-group"><label className="form-label">Cidade</label><input {...inp('city')} /></div>
                        <div className="form-group">
                            <label className="form-label">Estado</label>
                            <select className="form-select" value={form.state || ''} onChange={e => set('state', e.target.value)}>
                                <option value="">UF</option>
                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">CEP</label><input {...inp('zip_code')} placeholder="00000-000" /></div>
                    </div>
                </Section>

                <Section title="🏷️ Tags / Palavras-chave">
                    <div className="form-group">
                        <label className="form-label">
                            Palavras-chave para busca
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: tags.length >= MAX_TAGS ? 'var(--danger)' : 'var(--text-muted)' }}>
                                ({tags.length}/{MAX_TAGS})
                            </span>
                        </label>

                        {/* Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', minHeight: 48, alignItems: 'center', cursor: 'text' }}
                            onClick={() => document.getElementById('tag-input').focus()}>
                            {tags.map(t => (
                                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--primary-light)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {t}
                                    <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0, opacity: 0.7 }}>
                                        <span className="material-icons-round" style={{ fontSize: 14 }}>close</span>
                                    </button>
                                </span>
                            ))}
                            {tags.length < MAX_TAGS && (
                                <input
                                    id="tag-input"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={onTagKeyDown}
                                    onBlur={() => addTag(tagInput)}
                                    placeholder={tags.length === 0 ? 'pizza, delivery, italiano... (Enter para adicionar)' : ''}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', flex: 1, minWidth: 120 }}
                                />
                            )}
                        </div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <span className="material-icons-round" style={{ fontSize: 13, verticalAlign: 'middle' }}>info</span>
                            {' '}Digite e pressione Enter ou vírgula para adicionar. Máximo {MAX_TAGS} tags.
                        </small>
                    </div>
                </Section>
            </form>
        </div>
    );
}
