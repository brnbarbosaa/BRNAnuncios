import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SolicitarCadastro() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        contact_name: '', contact_email: '', contact_phone: '',
        business_name: '', category_id: '', short_description: '', description: '',
        phone: '', whatsapp: '', website: '', instagram: '', facebook: '',
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    });
    const [status, setStatus] = useState(null); // {type, msg}
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => { api.get('/public/categories').then(r => setCategories(r.data)); }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inp = (k) => ({ value: form[k], onChange: e => set(k, e.target.value), className: 'form-input' });

    const submit = async (e) => {
        e.preventDefault();
        if (!form.contact_name || !form.contact_email || !form.business_name) {
            return setStatus({ type: 'error', msg: 'Preencha os campos obrigatórios.' });
        }
        setLoading(true);
        try {
            await api.post('/public/requests', form);
            setStatus({ type: 'success', msg: 'Solicitação enviada com sucesso! Em breve nossa equipe entrará em contato.' });
            setStep(4);
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (step === 4) return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 480 }}>
                <span className="material-icons-round" style={{ fontSize: 80, color: 'var(--success)', display: 'block', marginBottom: 20 }}>check_circle</span>
                <h2 style={{ marginBottom: 12 }}>Solicitação Enviada!</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    Recebemos o seu pedido de cadastro para <strong style={{ color: 'var(--text-primary)' }}>{form.business_name}</strong>.
                    Nossa equipe vai analisar e entrar em contato em breve!
                </p>
            </div>
        </div>
    );

    const steps = ['Contato', 'Negócio', 'Endereço'];

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', padding: '32px 0' }}>
                <div className="container">
                    <h1 style={{ marginBottom: 8 }}>📢 Anuncie seu <span style={{ color: 'var(--primary-light)' }}>Negócio</span></h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Preencha o formulário e aguarde a aprovação da nossa equipe.</p>

                    {/* Stepper */}
                    <div style={{ display: 'flex', gap: 0, marginTop: 24, maxWidth: 400 }}>
                        {steps.map((s, i) => (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: i + 1 <= step ? 'pointer' : 'default' }} onClick={() => i + 1 < step && setStep(i + 1)}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i + 1 <= step ? 'var(--primary)' : 'var(--bg-card)', border: `2px solid ${i + 1 <= step ? 'var(--primary)' : 'var(--border-light)'}`, fontWeight: 700, fontSize: '0.85rem', color: i + 1 <= step ? '#fff' : 'var(--text-muted)' }}>
                                        {i + 1 < step ? <span className="material-icons-round" style={{ fontSize: 18 }}>check</span> : i + 1}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: i + 1 <= step ? 'var(--primary-light)' : 'var(--text-muted)', marginTop: 4 }}>{s}</span>
                                </div>
                                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i + 1 < step ? 'var(--primary)' : 'var(--border-light)', margin: '0 4px', marginBottom: 18 }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 24px', maxWidth: 760 }}>
                {status?.type === 'error' && <div className="alert alert-error" style={{ marginBottom: 20 }}><span className="material-icons-round">error</span>{status.msg}</div>}

                <form onSubmit={submit}>
                    {/* ── Passo 1: Contato ── */}
                    {step === 1 && (
                        <div className="card" style={{ padding: '28px' }}>
                            <h3 style={{ marginBottom: 20 }}>👤 Dados de Contato</h3>
                            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                                <div className="form-group"><label className="form-label">Nome completo *</label><input {...inp('contact_name')} placeholder="Seu nome" /></div>
                                <div className="form-group"><label className="form-label">E-mail *</label><input {...inp('contact_email')} type="email" placeholder="seu@email.com" /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label">Telefone</label>
                                <input {...inp('contact_phone')} placeholder="(11) 99999-9999" style={{ maxWidth: 240 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-primary" onClick={() => { if (!form.contact_name || !form.contact_email) return setStatus({ type: 'error', msg: 'Preencha nome e e-mail.' }); setStatus(null); setStep(2); }}>
                                    Próximo <span className="material-icons-round">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Passo 2: Negócio ── */}
                    {step === 2 && (
                        <div className="card" style={{ padding: '28px' }}>
                            <h3 style={{ marginBottom: 20 }}>🏪 Dados do Negócio</h3>
                            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                                <div className="form-group"><label className="form-label">Nome do negócio *</label><input {...inp('business_name')} placeholder="Ex: Padaria do João" /></div>
                                <div className="form-group">
                                    <label className="form-label">Categoria</label>
                                    <select className="form-select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Descrição curta</label>
                                <input {...inp('short_description')} placeholder="Resumo em até 120 caracteres" maxLength={300} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Descrição completa</label>
                                <textarea {...inp('description')} className="form-textarea" placeholder="Conte mais sobre o seu negócio..." rows={4} />
                            </div>
                            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                                <div className="form-group"><label className="form-label">Telefone</label><input {...inp('phone')} placeholder="(11) 3333-4444" /></div>
                                <div className="form-group"><label className="form-label">WhatsApp</label><input {...inp('whatsapp')} placeholder="(11) 99999-9999" /></div>
                            </div>
                            <div className="form-grid cols-3" style={{ marginBottom: 24 }}>
                                <div className="form-group"><label className="form-label">Website</label><input {...inp('website')} placeholder="https://..." /></div>
                                <div className="form-group"><label className="form-label">Instagram</label><input {...inp('instagram')} placeholder="@usuario" /></div>
                                <div className="form-group"><label className="form-label">Facebook</label><input {...inp('facebook')} placeholder="Link ou página" /></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><span className="material-icons-round">arrow_back</span> Voltar</button>
                                <button type="button" className="btn btn-primary" onClick={() => { if (!form.business_name) return setStatus({ type: 'error', msg: 'Informe o nome do negócio.' }); setStatus(null); setStep(3); }}>
                                    Próximo <span className="material-icons-round">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Passo 3: Endereço ── */}
                    {step === 3 && (
                        <div className="card" style={{ padding: '28px' }}>
                            <h3 style={{ marginBottom: 20 }}>📍 Endereço</h3>
                            <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Rua / Avenida</label><input {...inp('street')} placeholder="Rua Exemplo" /></div>
                                <div className="form-group"><label className="form-label">Número</label><input {...inp('number')} placeholder="123" /></div>
                                <div className="form-group"><label className="form-label">Complemento</label><input {...inp('complement')} placeholder="Sala 2, Andar 3..." /></div>
                                <div className="form-group"><label className="form-label">Bairro</label><input {...inp('neighborhood')} placeholder="Bairro" /></div>
                                <div className="form-group"><label className="form-label">Cidade</label><input {...inp('city')} placeholder="Cidade" /></div>
                                <div className="form-group"><label className="form-label">Estado</label>
                                    <select className="form-select" value={form.state} onChange={e => set('state', e.target.value)}>
                                        <option value="">UF</option>
                                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">CEP</label><input {...inp('zip_code')} placeholder="00000-000" /></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}><span className="material-icons-round">arrow_back</span> Voltar</button>
                                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                    {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">send</span> Enviar solicitação</>}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
