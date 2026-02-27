import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';

export default function ClientPerfil() {
    const { user } = useAuth();
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
    const [saving, setSaving] = useState(false);
    const [savingPass, setSavingPass] = useState(false);
    const [alert, setAlert] = useState(null);
    const [show, setShow] = useState({ cur: false, new: false, conf: false });

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/client/profile', form);
            setAlert({ type: 'success', msg: '✅ Perfil atualizado!' });
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const changePass = async (e) => {
        e.preventDefault();
        if (passForm.newPass !== passForm.confirm) return setAlert({ type: 'error', msg: 'As senhas não coincidem.' });
        if (passForm.newPass.length < 6) return setAlert({ type: 'error', msg: 'A nova senha deve ter pelo menos 6 caracteres.' });
        setSavingPass(true);
        try {
            await api.put('/client/profile/password', { current_password: passForm.current, new_password: passForm.newPass });
            setAlert({ type: 'success', msg: '✅ Senha alterada com sucesso!' });
            setPassForm({ current: '', newPass: '', confirm: '' });
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSavingPass(false); }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Meu Perfil</h1><p>Gerencie seus dados de acesso</p></div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            {/* Avatar card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '32px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--success), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{user?.email}</p>
                    <span className="badge badge-info" style={{ marginTop: 8, display: 'inline-block' }}>Cliente</span>
                </div>
            </div>

            {/* Dados pessoais */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border-light)', fontSize: '1rem' }}>👤 Dados Pessoais</h3>
                <form onSubmit={saveProfile}>
                    <div className="form-grid cols-2" style={{ marginBottom: 16 }}>
                        <div className="form-group"><label className="form-label">Nome completo</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Telefone</label><input {...phoneInputProps(form.phone, v => setForm(f => ({ ...f, phone: v })))} /></div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar dados</>}
                    </button>
                </form>
            </div>

            {/* Alterar senha */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border-light)', fontSize: '1rem' }}>🔒 Alterar Senha</h3>
                <form onSubmit={changePass}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
                        {[
                            { key: 'cur', label: 'Senha atual', field: 'current' },
                            { key: 'new', label: 'Nova senha', field: 'newPass' },
                            { key: 'conf', label: 'Confirmar nova senha', field: 'confirm' },
                        ].map(({ key, label, field }) => (
                            <div key={field} className="form-group">
                                <label className="form-label">{label}</label>
                                <div style={{ position: 'relative' }}>
                                    <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>lock</span>
                                    <input
                                        type={show[key] ? 'text' : 'password'}
                                        className="form-input"
                                        style={{ paddingLeft: 40, paddingRight: 44 }}
                                        value={passForm[field]}
                                        onChange={e => setPassForm(f => ({ ...f, [field]: e.target.value }))}
                                        placeholder="••••••••"
                                        minLength={field !== 'current' ? 6 : undefined}
                                    />
                                    <button type="button" onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                        <span className="material-icons-round" style={{ fontSize: 18 }}>{show[key] ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary" disabled={savingPass} style={{ alignSelf: 'flex-start' }}>
                            {savingPass ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">lock_reset</span> Alterar senha</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
