import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';

const PLAN_DISPLAY = {
    free: { name: 'Gratuito', icon: '🆓', color: 'var(--text-muted)', features: ['Foto de capa', 'Informações básicas', 'Contato (telefone + WhatsApp)', 'Horários de funcionamento'] },
    basic: { name: 'Básico', icon: '⭐', color: 'var(--accent)', features: ['Tudo do Gratuito +', 'Descrição completa', 'Redes sociais (até 5)', 'Selo de Verificado'] },
    premium: { name: 'Premium', icon: '💎', color: 'var(--primary-light)', features: ['Tudo do Básico +', 'Galeria de fotos (5)', 'Endereço + Google Maps', 'Tags e palavras-chave', 'Painel de estatísticas', 'Destaque no carrossel', 'Prioridade na busca'] },
};

export default function SolicitarCadastro() {
    const [step, setStep] = useState(1); // 1 = plano, 2 = formulário
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [plans, setPlans] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        contact_name: '', contact_email: '', contact_phone: '', business_name: '', category_id: '', category_observation: '',
    });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    const inp = (k) => ({ className: 'form-input', value: form[k] || '', onChange: e => set(k, e.target.value) });

    useEffect(() => {
        api.get('/public/plans').then(r => setPlans(r.data)).catch(() => { });
        api.get('/public/categories').then(r => setCategories(r.data)).catch(() => { });
    }, []);

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
            await api.post('/public/requests', { ...form, plan: selectedPlan });
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
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 8 }}>
                    Plano selecionado: <strong style={{ color: PLAN_DISPLAY[selectedPlan]?.color }}>{PLAN_DISPLAY[selectedPlan]?.icon} {PLAN_DISPLAY[selectedPlan]?.name}</strong>
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
                <div className="container" style={{ maxWidth: 900 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons-round" style={{ color: 'var(--primary-light)', fontSize: 28 }}>add_business</span>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', marginBottom: 2 }}>Anuncie seu <span style={{ color: 'var(--primary-light)' }}>Negócio</span></h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {step === 1 ? 'Escolha o plano ideal para o seu negócio' : 'Preencha seus dados para começar'}
                            </p>
                        </div>
                    </div>

                    {/* Steps indicator */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                        {[1, 2].map(s => (
                            <div key={s} style={{
                                flex: 1, height: 4, borderRadius: 2,
                                background: s <= step ? 'var(--primary)' : 'var(--border-light)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 24px', maxWidth: 900 }}>
                {status?.type === 'error' && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span className="material-icons-round">error</span>{status.msg}
                    </div>
                )}

                {/* ── STEP 1: Seleção de Plano ── */}
                {step === 1 && (
                    <div>
                        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Escolha seu plano</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32 }}>
                            Comece gratuitamente e faça upgrade quando quiser
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                            {['free', 'basic', 'premium'].map(planKey => {
                                const pd = PLAN_DISPLAY[planKey];
                                const apiPlan = plans.find(p => p.slug === (planKey === 'free' ? 'gratuito' : planKey === 'basic' ? 'basico' : 'premium'));
                                const price = apiPlan?.price || (planKey === 'free' ? 0 : planKey === 'basic' ? 49.90 : 99.90);
                                const isSelected = selectedPlan === planKey;
                                const isPopular = planKey === 'premium';

                                return (
                                    <div key={planKey} onClick={() => setSelectedPlan(planKey)} style={{
                                        background: 'var(--bg-card)',
                                        border: `2px solid ${isSelected ? pd.color : 'var(--border-light)'}`,
                                        borderRadius: 'var(--radius-xl)', padding: '28px 24px',
                                        cursor: 'pointer', position: 'relative',
                                        transition: 'all 0.3s',
                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                        boxShadow: isSelected ? `0 0 20px ${pd.color}22` : 'none',
                                    }}>
                                        {isPopular && (
                                            <div style={{
                                                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                                background: 'var(--primary)', color: '#fff', padding: '2px 16px',
                                                borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700,
                                                textTransform: 'uppercase',
                                            }}>Mais popular</div>
                                        )}

                                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 4 }}>{pd.icon}</div>
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: pd.color }}>{pd.name}</h3>
                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: pd.color }}>
                                                {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2).replace('.', ',')}`}
                                            </div>
                                            {price > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/mês</div>}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {pd.features.map((feat, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
                                                    <span className="material-icons-round" style={{ fontSize: 16, color: i === 0 && planKey !== 'free' ? 'var(--text-muted)' : 'var(--success)' }}>
                                                        {i === 0 && planKey !== 'free' ? 'arrow_upward' : 'check_circle'}
                                                    </span>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {isSelected && (
                                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                                                <span className="material-icons-round" style={{ color: pd.color, fontSize: 28 }}>radio_button_checked</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                                <span className="material-icons-round">arrow_forward</span>
                                Continuar com {PLAN_DISPLAY[selectedPlan]?.icon} {PLAN_DISPLAY[selectedPlan]?.name}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Formulário ── */}
                {step === 2 && (
                    <div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ marginBottom: 16 }}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>arrow_back</span> Alterar plano
                        </button>

                        {/* Plano selecionado */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
                            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)', padding: '14px 20px',
                        }}>
                            <span style={{ fontSize: '1.4rem' }}>{PLAN_DISPLAY[selectedPlan]?.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: PLAN_DISPLAY[selectedPlan]?.color }}>{PLAN_DISPLAY[selectedPlan]?.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Plano selecionado</div>
                            </div>
                            {selectedPlan !== 'free' && (
                                <span style={{ marginLeft: 'auto', fontWeight: 800, color: PLAN_DISPLAY[selectedPlan]?.color }}>
                                    R$ {selectedPlan === 'basic' ? '49,90' : '99,90'}/mês
                                </span>
                            )}
                        </div>

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
                                    <label className="form-label">Categoria do negócio</label>
                                    <select className="form-select" value={form.category_id} onChange={e => {
                                        set('category_id', e.target.value);
                                        if (e.target.value !== 'outros-id') set('category_observation', '');
                                    }}>
                                        <option value="">Selecione...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {(categories.find(c => c.id === parseInt(form.category_id))?.slug === 'outros' || form.category_observation) && (
                                        <div style={{ marginTop: 8 }}>
                                            <input {...inp('category_observation')} placeholder="Especifique a categoria (Outros)..." style={{ borderLeft: '3px solid var(--accent)' }} />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Opcional: preencha caso não encontrou sua categoria na lista.</small>
                                        </div>
                                    )}
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
                                            className="form-input" type="email"
                                            value={form.contact_email}
                                            onChange={e => set('contact_email', e.target.value)}
                                            placeholder="seu@email.com" required
                                        />
                                    </div>
                                </div>

                                {/* Simulação pagamento */}
                                {selectedPlan !== 'free' && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.06))',
                                        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)',
                                        padding: '18px 20px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                            <span className="material-icons-round" style={{ color: 'var(--primary-light)' }}>credit_card</span>
                                            <strong style={{ color: 'var(--text-primary)' }}>Pagamento</strong>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
                                            O pagamento será realizado após a aprovação do seu cadastro.
                                            Você receberá um link de pagamento por e-mail com todas as instruções.
                                        </p>
                                    </div>
                                )}

                                <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', color: 'var(--info)', marginRight: 6 }}>info</span>
                                    Após a aprovação, você receberá um e-mail com suas credenciais de acesso para completar todas as informações do seu negócio.
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ alignSelf: 'flex-end' }}>
                                    {loading
                                        ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                        : <><span className="material-icons-round">send</span> Enviar solicitação</>
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 16 }}>
                    Já tem acesso?{' '}
                    <a href="/login" style={{ color: 'var(--primary-light)' }}>Faça login aqui</a>
                </p>
            </div>
        </div>
    );
}
