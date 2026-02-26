import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminUsuarios() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'client', phone: '', active: true, password: '' });
    const [alert, setAlert] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        api.get(`/admin/users?q=${q}&page=${page}`)
            .then(r => { setUsers(r.data.users); setPagination(r.data.pagination); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [q, page]);

    const openEdit = (user) => {
        setEditing(user);
        setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || '', active: !!user.active, password: '' });
    };

    const save = async () => {
        setSaving(true);
        try {
            if (editing === 'new') {
                await api.post('/admin/users', form);
                setAlert({ type: 'success', msg: 'Usuário criado.' });
            } else {
                await api.put(`/admin/users/${editing.id}`, form);
                setAlert({ type: 'success', msg: 'Usuário atualizado.' });
            }
            setEditing(null); load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const toggle = async (user) => {
        await api.put(`/admin/users/${user.id}`, { ...user, active: !user.active, phone: user.phone || '' });
        load();
    };

    const remove = async (user) => {
        if (!window.confirm(`Excluir ${user.name}?`)) return;
        try { await api.delete(`/admin/users/${user.id}`); load(); }
        catch (err) { setAlert({ type: 'error', msg: err.message }); }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Usuários</h1><p>Clientes e administradores do sistema</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing('new'); setForm({ name: '', email: '', role: 'client', phone: '', active: true, password: '' }); }}>
                    <span className="material-icons-round">person_add</span> Novo usuário
                </button>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }} onClick={() => setAlert(null)}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <div style={{ marginBottom: 16 }}>
                <input className="form-input" placeholder="🔍 Buscar por nome ou e-mail..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} style={{ maxWidth: 360 }} />
            </div>

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Usuário</th><th>Papel</th><th>Negócio</th><th>Último login</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                            : users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.78rem' }}>{u.email}</div>
                                    </td>
                                    <td><span className={`badge ${u.role === 'admin' ? 'badge-premium' : 'badge-info'}`}>{u.role}</span></td>
                                    <td style={{ fontSize: '0.85rem' }}>{u.business_name || '—'}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca'}</td>
                                    <td><span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}><span className="material-icons-round" style={{ fontSize: 16 }}>edit</span></button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}><span className="material-icons-round" style={{ fontSize: 16, color: u.active ? 'var(--warning)' : 'var(--success)' }}>{u.active ? 'block' : 'check_circle'}</span></button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => remove(u)}><span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="modal-overlay" onClick={() => setEditing(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing === 'new' ? 'Novo Usuário' : 'Editar Usuário'}</h3>
                            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><span className="material-icons-round">close</span></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-grid cols-2">
                                <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">E-mail *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Telefone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Papel</label>
                                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="client">Cliente</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">{editing === 'new' ? 'Senha *' : 'Nova senha (deixe em branco para manter)'}</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
                                <div className="form-group" style={{ justifyContent: 'center' }}>
                                    <label className="form-label">Ativo</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                                        <span>Conta ativa</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
