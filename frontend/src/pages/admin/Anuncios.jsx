import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const STATUS_LABELS = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' };
const STATUS_CLASS = { active: 'badge-active', inactive: 'badge-inactive', pending: 'badge-pending' };
const PLAN_CLASS = { free: 'badge-info', basic: 'badge-info', premium: 'badge-premium' };

export default function AdminAnuncios() {
    const [businesses, setBusinesses] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [alert, setAlert] = useState(null);

    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams({ q, status, page });
        if (!q) params.delete('q');
        if (!status) params.delete('status');
        api.get(`/admin/businesses?${params}`)
            .then(r => { setBusinesses(r.data.businesses); setPagination(r.data.pagination); })
            .catch(err => setAlert({ type: 'error', msg: err.response?.data?.error || err.message }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [q, status, page]);

    const update = (key, val) => {
        const next = new URLSearchParams(searchParams);
        if (val) next.set(key, val); else next.delete(key);
        next.delete('page');
        setSearchParams(next);
    };

    const toggleStatus = async (id, current) => {
        const next = current === 'active' ? 'inactive' : 'active';
        try {
            const [b] = businesses.filter(x => x.id === id);
            await api.put(`/admin/businesses/${id}`, { ...b, status: next, name: b.name });
            setAlert({ type: 'success', msg: `Status alterado para ${STATUS_LABELS[next]}.` });
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
    };

    const remove = async (id, name) => {
        if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await api.delete(`/admin/businesses/${id}`);
            setAlert({ type: 'success', msg: 'Anúncio excluído.' });
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Anúncios</h1><p>Gerencie todos os negócios cadastrados</p></div>
                <Link to="/admin/anuncios/novo" className="btn btn-primary btn-sm">
                    <span className="material-icons-round">add</span> Novo anúncio
                </Link>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }} onClick={() => setAlert(null)}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>search</span>
                    <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Buscar por nome..."
                        defaultValue={q} onKeyDown={e => e.key === 'Enter' && update('q', e.target.value)} onBlur={e => update('q', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['', 'active', 'inactive', 'pending'].map(s => (
                        <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => update('status', s)}>
                            {s === '' ? 'Todos' : STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Negócio</th><th>Proprietário</th><th>Categoria</th><th>Plano</th><th>Views</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                        ) : businesses.map(b => (
                            <tr key={b.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {b.logo ? <img src={b.logo} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span className="material-icons-round" style={{ fontSize: 18, color: 'var(--text-muted)' }}>store</span></div>}
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{b.owner_name || '—'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{b.category_name || '—'}</td>
                                <td><span className={`badge ${PLAN_CLASS[b.plan]}`}>{b.plan}</span></td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(b.views || 0).toLocaleString('pt-BR')}</td>
                                <td><span className={`badge ${STATUS_CLASS[b.status]}`}>{STATUS_LABELS[b.status]}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Link to={`/admin/anuncios/${b.id}`} className="btn btn-ghost btn-sm" title="Editar">
                                            <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                                        </Link>
                                        <button className="btn btn-ghost btn-sm" title={b.status === 'active' ? 'Desativar' : 'Ativar'} onClick={() => toggleStatus(b.id, b.status)}>
                                            <span className="material-icons-round" style={{ fontSize: 16, color: b.status === 'active' ? 'var(--warning)' : 'var(--success)' }}>{b.status === 'active' ? 'pause_circle' : 'play_circle'}</span>
                                        </button>
                                        <Link to={`/anuncio/${b.slug}`} target="_blank" className="btn btn-ghost btn-sm" title="Ver no site">
                                            <span className="material-icons-round" style={{ fontSize: 16 }}>open_in_new</span>
                                        </Link>
                                        <button className="btn btn-ghost btn-sm" title="Excluir" onClick={() => remove(b.id, b.name)}>
                                            <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination?.pages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => update('page', page - 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_left</span></button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => update('page', p)}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={page >= pagination.pages} onClick={() => update('page', page + 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_right</span></button>
                </div>
            )}
        </div>
    );
}
