import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role === 'admin') navigate('/admin/dashboard');
            else navigate('/cliente/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, var(--bg-base) 70%)',
            padding: '20px',
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <span className="material-icons-round" style={{ fontSize: 40, background: 'linear-gradient(135deg, var(--primary-light), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>storefront</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            BRN <span style={{ color: 'var(--primary-light)' }}>Anúncios</span>
                        </span>
                    </Link>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>Área restrita — faça login para continuar</p>
                </div>

                {/* Card */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)' }}>
                    <h2 style={{ marginBottom: 28, fontSize: '1.4rem' }}>Entrar</h2>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <span className="material-icons-round">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <div style={{ position: 'relative' }}>
                                <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 20 }}>email</span>
                                <input type="email" className="form-input" style={{ paddingLeft: 40 }}
                                    placeholder="seu@email.com"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    required autoFocus />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Senha</label>
                            <div style={{ position: 'relative' }}>
                                <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 20 }}>lock</span>
                                <input type={showPass ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    required />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: 20 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: 4 }} disabled={loading}>
                            {loading
                                ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                : <><span className="material-icons-round">login</span> Entrar</>
                            }
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link to="/solicitar-cadastro" style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                        Ainda não tem cadastro? <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Solicitar cadastro</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
