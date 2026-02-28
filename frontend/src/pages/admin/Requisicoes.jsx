import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUS_LABELS = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };
const STATUS_CLASS = { pending: 'badge-pending', approved: 'badge-active', rejected: 'badge-danger' };

export default function AdminRequisicoes() {
    const [requests, setRequests] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        const params = `status=${status}&page=${page}`;
        api.get(`/admin/requests?${params}`)
            .then(r => { setRequests(r.data.requests); setPagination(r.data.pagination); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [status, page]);

    const approve = async (id) => {
        setActionLoading(true);
        try {
            const r = await api.put(`/admin/requests/${id}/approve`, {});
            setAlert({ type: 'success', msg: `✅ Aprovado! Credenciais: ${r.data.credentials?.email} / ${r.data.credentials?.password}` });
            setSelected(null);
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setActionLoading(false); }
    };

    const reject = async (id) => {
        setActionLoading(true);
        try {
            await api.put(`/admin/requests/${id}/reject`, { admin_notes: notes });
            setAlert({ type: 'success', msg: 'Requisição rejeitada.' });
            setSelected(null);
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setActionLoading(false); }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Requisições de Cadastro</h1><p>Gerencie as solicitações recebidas</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['', 'pending', 'approved', 'rejected'].map(s => (
                        <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
                            {s === '' ? 'Todas' : STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }} onClick={() => setAlert(null)}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <div className="table-wrap">
                <table>
                    <thead><tr>
                        <th>Solicitante</th><th>Negócio</th><th>Categoria</th><th>Data</th><th>Status</th><th>Ações</th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                        ) : requests.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.contact_name}</div>
                                    <div style={{ fontSize: '0.78rem' }}>{r.contact_email}</div>
                                </td>
                                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.business_name}</td>
                                <td>
                                    {r.category_name || '—'}
                                    {r.category_observation && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Obs: {r.category_observation}</div>}
                                </td>
                                <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                                <td><span className={`badge ${STATUS_CLASS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(r); setNotes(''); }}>
                                            <span className="material-icons-round" style={{ fontSize: 16 }}>visibility</span>
                                        </button>
                                        {r.status === 'pending' && (
                                            <>
                                                <button className="btn btn-success btn-sm" onClick={() => approve(r.id)} disabled={actionLoading}>
                                                    <span className="material-icons-round" style={{ fontSize: 16 }}>check</span>
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => { setSelected(r); setNotes(''); }}>
                                                    <span className="material-icons-round" style={{ fontSize: 16 }}>close</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination?.pages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_left</span></button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_right</span></button>
                </div>
            )}

            {/* Modal detalhe / rejeitar */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Requisição — {selected.business_name}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                ['Contato', `${selected.contact_name} | ${selected.contact_email} | ${selected.contact_phone || '—'}`],
                                ['Negócio', selected.business_name],
                                ['Sugestão de Categoria', selected.category_observation || 'Nenhuma informada'],
                                ['Descrição', selected.short_description || '—'],
                                ['WhatsApp', selected.whatsapp || '—'],
                                ['Endereço', [selected.street, selected.number, selected.neighborhood, selected.city, selected.state].filter(Boolean).join(', ') || '—'],
                                ['Instagram', selected.instagram || '—'],
                            ].map(([l, v]) => (
                                <div key={l} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                                    <div style={{ fontSize: '0.9rem' }}>{v}</div>
                                </div>
                            ))}
                            {selected.status === 'pending' && (
                                <div className="form-group">
                                    <label className="form-label">Observações (rejeição)</label>
                                    <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional — motivo da rejeição..." rows={3} />
                                </div>
                            )}
                        </div>
                        {selected.status === 'pending' && (
                            <div className="modal-footer">
                                <button className="btn btn-danger" onClick={() => reject(selected.id)} disabled={actionLoading}>
                                    <span className="material-icons-round">close</span> Rejeitar
                                </button>
                                <button className="btn btn-success" onClick={() => approve(selected.id)} disabled={actionLoading}>
                                    <span className="material-icons-round">check</span> Aprovar e criar conta
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
