import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { phoneInputProps, maskPhone } from '../../utils/phoneMask';

export default function SolicitarCadastro() {
    const [form, setForm] = useState({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        business_name: '',
    });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.contact_name || !form.contact_email || !form.business_name) {
            return setStatus({ type: 'error', msg: 'Preencha todos os campos obrigatórios.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.contact_email)) {
            return setStatus({ type: 'error', msg: 'Informe um e-mail válido.' });
        }
        setLoading(true);
        setStatus(null);
        try {
            await api.post('/public/requests', form);
            setDone(true);
        } catch (err) {
            setStatus({ type: 'error', msg: err.message || 'Erro ao enviar. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    if (done) return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 520 }}>
                <span className="material-icons-round" style={{ fontSize: 80, color: 'var(--success)', display: 'block', marginBottom: 20 }}>check_circle</span>
                <h2 style={{ marginBottom: 12 }}>Solicitação Enviada! 🎉</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 8 }}>
                    Recebemos o pedido de cadastro para <strong style={{ color: 'var(--text-primary)' }}>{form.business_name}</strong>.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28 }}>
                    Nossa equipe vai analisar as informações e entrar em contato pelo e-mail <strong style={{ color: 'var(--primary-light)' }}>{form.contact_email}</strong> em breve.
                </p>
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                    <span className="material-icons-round">home</span> Voltar ao início
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            {/* Hero */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', padding: '40px 0 32px' }}>
                <div className="container" style={{ maxWidth: 680 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons-round" style={{ color: 'var(--primary-light)', fontSize: 28 }}>add_business</span>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', marginBottom: 2 }}>Anuncie seu <span style={{ color: 'var(--primary-light)' }}>Negócio</span></h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Preencha os dados abaixo e nossa equipe entrará em contato.</p>
                        </div>
                    </div>

                    {/* Benefícios */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
                        {[
                            { icon: 'visibility', label: 'Visibilidade online' },
                            { icon: 'thumb_up', label: 'Aprovação rápida' },
                            { icon: 'edit', label: 'Gerencie seu perfil' },
                        ].map(b => (
                            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <span className="material-icons-round" style={{ fontSize: 15, color: 'var(--success)' }}>{b.icon}</span>
                                {b.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Formulário */}
            <div className="container" style={{ padding: '40px 24px', maxWidth: 680 }}>
                {status?.type === 'error' && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span className="material-icons-round">error</span>{status.msg}
                    </div>
                )}

                <div className="card" style={{ padding: '32px' }}>
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Nome do estabelecimento *</label>
                            <input
                                className="form-input"
                                value={form.business_name}
                                onChange={e => set('business_name', e.target.value)}
                                placeholder="Ex: Padaria do João, Barbearia Central..."
                                required
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                ⚠️ O nome do estabelecimento não poderá ser alterado após o cadastro.
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nome do responsável *</label>
                            <input
                                className="form-input"
                                value={form.contact_name}
                                onChange={e => set('contact_name', e.target.value)}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>

                        <div className="form-grid cols-2">
                            <div className="form-group">
                                <label className="form-label">Telefone / WhatsApp *</label>
                                <input {...phoneInputProps(form.contact_phone, v => set('contact_phone', v))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail *</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={form.contact_email}
                                    onChange={e => set('contact_email', e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', color: 'var(--info)', marginRight: 6 }}>info</span>
                            Após a aprovação, você receberá um e-mail com suas credenciais de acesso para completar todas as informações do seu negócio (fotos, endereço, horários, redes sociais e muito mais).
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ alignSelf: 'flex-end' }}>
                            {loading
                                ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                : <><span className="material-icons-round">send</span> Enviar solicitação</>
                            }
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 16 }}>
                    Já tem acesso?{' '}
                    <a href="/login" style={{ color: 'var(--primary-light)' }}>Faça login aqui</a>
                </p>
            </div>
        </div>
    );
}
