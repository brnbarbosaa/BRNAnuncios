import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';
import SocialIcon, { SOCIAL_LABELS, SOCIAL_PREFIXES, SOCIAL_PLATFORMS as PLATFORMS_LIST } from '../../components/SocialIcons';

// ── Definido FORA do componente ──────────────────────────────
function Section({ title, children, locked, lockMsg }) {
    if (locked) return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20, opacity: 0.7 }}>
            <h3 style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-light)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {title}
                <span className="material-icons-round" style={{ fontSize: 18, color: 'var(--accent)' }}>lock</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
                <span className="material-icons-round" style={{ color: 'var(--accent)', fontSize: 22 }}>workspace_premium</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{lockMsg || 'Disponível no plano superior'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Faça upgrade para desbloquear esta funcionalidade</div>
                </div>
            </div>
        </div>
    );
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
    const [planFeatures, setPlanFeatures] = useState([]);
    const [planLimits, setPlanLimits] = useState({});
    const [socialLinks, setSocialLinks] = useState([]);

    useEffect(() => {
        Promise.all([
            api.get('/client/business'),
            api.get('/public/categories'),
        ]).then(([bRes, cRes]) => {
            const b = bRes.data.business;
            setBusiness(b);
            setCategories(cRes.data);
            setPlanFeatures(bRes.data.planFeatures || []);
            setPlanLimits(bRes.data.planLimits || {});

            // Parse social_links
            let links = [];
            if (b.social_links) {
                links = Array.isArray(b.social_links) ? b.social_links :
                    (typeof b.social_links === 'string' ? JSON.parse(b.social_links) : []);
            }
            setSocialLinks(links);

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

    const hasFeat = (f) => planFeatures.includes(f);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inp = (k) => ({ value: form[k] || '', onChange: e => set(k, e.target.value), className: 'form-input' });

    // ── Redes Sociais Dinâmicas ─────────────────────────────────
    const addSocialLink = () => {
        const limit = planLimits.social_links || 5;
        if (socialLinks.length >= limit) return;
        setSocialLinks([...socialLinks, { platform: '', url: '' }]);
    };
    const updateSocialLink = (idx, field, value) => {
        const newLinks = [...socialLinks];
        newLinks[idx] = { ...newLinks[idx], [field]: value };
        setSocialLinks(newLinks);
    };
    const removeSocialLink = (idx) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== idx));
    };

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
            await api.put('/client/business', { ...form, social_links: socialLinks });
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

    const plan = business.plan || 'free';
    const planLabel = plan === 'premium' ? '💎 Premium' : plan === 'basic' ? '⭐ Básico' : '🆓 Gratuito';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Meu Anúncio</h1>
                    <p>Mantenha as informações do seu negócio atualizadas</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge" style={{ background: plan === 'premium' ? 'rgba(99,102,241,0.15)' : plan === 'basic' ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)', color: plan === 'premium' ? 'var(--primary-light)' : plan === 'basic' ? 'var(--accent)' : 'var(--text-muted)', padding: '4px 14px', fontWeight: 700 }}>
                        {planLabel}
                    </span>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar</>}
                    </button>
                </div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <form onSubmit={save}>
                {/* ── Informações Básicas (todos os planos) ── */}
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
                </Section>

                {/* ── Contato (todos os planos) ── */}
                <Section title="📞 Contato">
                    <div className="form-grid cols-3">
                        <div className="form-group"><label className="form-label">Telefone</label><input {...phoneInputProps(form.phone, v => set('phone', v))} /></div>
                        <div className="form-group"><label className="form-label">WhatsApp</label><input {...phoneInputProps(form.whatsapp, v => set('whatsapp', v))} /></div>
                        <div className="form-group"><label className="form-label">E-mail</label><input {...inp('email')} type="email" placeholder="contato@..." /></div>
                    </div>
                </Section>

                {/* ── Descrição completa (Básico+) ── */}
                <Section title="📝 Descrição Completa" locked={!hasFeat('description')} lockMsg="Disponível nos planos Básico e Premium">
                    <div className="form-group">
                        <label className="form-label">Descrição completa</label>
                        <textarea {...inp('description')} className="form-textarea" rows={5} placeholder="Conte tudo sobre o seu negócio..." />
                    </div>
                </Section>

                {/* ── Redes Sociais (Básico+) ── */}
                <Section title="🌐 Redes Sociais" locked={!hasFeat('social_links')} lockMsg="Disponível nos planos Básico e Premium">
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
                                    placeholder={link.platform ? (SOCIAL_PREFIXES[link.platform] || '') + '...' : 'Link / @usuario'}
                                    style={{ flex: 1 }} />
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSocialLink(idx)}
                                    style={{ color: 'var(--danger)', flexShrink: 0 }}>
                                    <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    {socialLinks.length < (planLimits.social_links || 5) && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addSocialLink}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>add</span>
                            Adicionar rede social ({socialLinks.length}/{planLimits.social_links || 5})
                        </button>
                    )}
                </Section>

                {/* ── Endereço (Premium) ── */}
                <Section title="📍 Endereço" locked={!hasFeat('address_map')} lockMsg="Disponível no plano Premium — inclui Google Maps na página pública">
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

                {/* ── Tags (Premium) ── */}
                <Section title="🏷️ Tags / Palavras-chave" locked={!hasFeat('tags')} lockMsg="Disponível no plano Premium — melhora a busca do seu negócio">
                    <div className="form-group">
                        <label className="form-label">
                            Palavras-chave para busca
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: tags.length >= MAX_TAGS ? 'var(--danger)' : 'var(--text-muted)' }}>
                                ({tags.length}/{MAX_TAGS})
                            </span>
                        </label>

                        {/* Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', minHeight: 48, alignItems: 'center', cursor: 'text' }}
                            onClick={() => document.getElementById('tag-input')?.focus()}>
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
