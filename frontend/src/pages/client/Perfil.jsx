import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { phoneInputProps } from '../../utils/phoneMask';

export default function ClientPerfil() {
    const { user } = useAuth();
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    const [savingPass, setSavingPass] = useState(false);
    const [alert, setAlert] = useState(null);
    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confPass, setConfPass] = useState('');
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/client/profile', { phone });
            setAlert({ type: 'success', msg: '✅ Telefone atualizado!' });
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const changePass = async (e) => {
        e.preventDefault();
        if (newPass !== confPass) return setAlert({ type: 'error', msg: 'As senhas não coincidem.' });
        if (newPass.length < 6) return setAlert({ type: 'error', msg: 'A nova senha deve ter pelo menos 6 caracteres.' });
        setSavingPass(true);
        try {
            await api.put('/client/profile/password', { current_password: curPass, new_password: newPass });
            setAlert({ type: 'success', msg: '✅ Senha alterada com sucesso!' });
            setCurPass(''); setNewPass(''); setConfPass('');
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSavingPass(false); }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Meu Perfil</h1><p>Gerencie seus dados de acesso</p></div>
            </div>

            {alert && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
                    <span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
                    {alert.msg}
                </div>
            )}

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
                <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Nome — bloqueado */}
                    <div className="form-group">
                        <label className="form-label">Nome completo</label>
                        <input className="form-input" value={user?.name || ''} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>🔒 O nome está vinculado ao seu cadastro e não pode ser alterado.</small>
                    </div>

                    {/* E-mail — bloqueado */}
                    <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input className="form-input" value={user?.email || ''} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>🔒 O e-mail é seu login e não pode ser alterado.</small>
                    </div>

                    {/* Telefone — editável */}
                    <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <input {...phoneInputProps(phone, setPhone)} style={{ maxWidth: 240 }} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                        {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar telefone</>}
                    </button>
                </form>
            </div>

            {/* Alterar senha */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border-light)', fontSize: '1rem' }}>🔒 Alterar Senha</h3>
                <form onSubmit={changePass} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
                    {/* Senha atual */}
                    <div className="form-group">
                        <label className="form-label">Senha atual</label>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>lock</span>
                            <input type={showCur ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }} value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowCur(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>{showCur ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Nova senha */}
                    <div className="form-group">
                        <label className="form-label">Nova senha</label>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>lock_reset</span>
                            <input type={showNew ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} />
                            <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>{showNew ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Confirmar senha */}
                    <div className="form-group">
                        <label className="form-label">Confirmar nova senha</label>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>lock</span>
                            <input type={showConf ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }} value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowConf(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <span className="material-icons-round" style={{ fontSize: 18 }}>{showConf ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={savingPass} style={{ alignSelf: 'flex-start' }}>
                        {savingPass ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">lock_reset</span> Alterar senha</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
