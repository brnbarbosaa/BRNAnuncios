import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const LEVEL_COLORS = { info: 'var(--info)', success: 'var(--success)', warning: 'var(--accent)', error: 'var(--danger)' };
const LEVEL_ICONS = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [summary, setSummary] = useState([]);
    const [topActions, setTopActions] = useState([]);
    const [actions, setActions] = useState([]);
    const [filters, setFilters] = useState({ q: '', action: '', level: '', date_from: '', date_to: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ ...filters, page });
        Object.keys(filters).forEach(k => !filters[k] && params.delete(k));
        api.get(`/admin/logs?${params}`)
            .then(r => {
                setLogs(r.data.logs);
                setPagination(r.data.pagination);
                setSummary(r.data.summary || []);
                setTopActions(r.data.top_actions || []);
            }).finally(() => setLoading(false));
    }, [filters, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { api.get('/admin/logs/actions').then(r => setActions(r.data)); }, []);

    const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

    const summaryTotal = summary.reduce((a, s) => a + s.count, 0);

    return (
        <div>
            <div className="page-header">
                <div><h1>Logs do Sistema</h1><p>Auditoria completa de todas as ações</p></div>
                <button className="btn btn-ghost btn-sm" onClick={load}>
                    <span className="material-icons-round">refresh</span> Atualizar
                </button>
            </div>

            {/* Sumário 24h */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { level: 'success', label: 'Sucesso', icon: 'check_circle' },
                    { level: 'info', label: 'Info', icon: 'info' },
                    { level: 'warning', label: 'Avisos', icon: 'warning' },
                    { level: 'error', label: 'Erros', icon: 'error' },
                ].map(item => {
                    const found = summary.find(s => s.level === item.level);
                    return (
                        <div key={item.level} className="stat-card" onClick={() => setFilter('level', filters.level === item.level ? '' : item.level)} style={{ cursor: 'pointer' }}>
                            <div className="stat-icon" style={{ background: `${LEVEL_COLORS[item.level]}22`, color: LEVEL_COLORS[item.level] }}>
                                <span className="material-icons-round">{item.icon}</span>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: LEVEL_COLORS[item.level], fontSize: '1.5rem' }}>{found?.count ?? 0}</div>
                                <div className="stat-label">{item.label} (24h)</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filtros */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Busca livre</label>
                    <input className="form-input" placeholder="Buscar por ação, usuário, IP..." value={filters.q}
                        onChange={e => setFilter('q', e.target.value)} />
                </div>
                <div style={{ minWidth: 180 }}>
                    <label className="form-label">Ação</label>
                    <select className="form-select" value={filters.action} onChange={e => setFilter('action', e.target.value)}>
                        <option value="">Todas</option>
                        {actions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div style={{ minWidth: 140 }}>
                    <label className="form-label">Nível</label>
                    <select className="form-select" value={filters.level} onChange={e => setFilter('level', e.target.value)}>
                        <option value="">Todos</option>
                        <option value="success">Sucesso</option>
                        <option value="info">Info</option>
                        <option value="warning">Aviso</option>
                        <option value="error">Erro</option>
                    </select>
                </div>
                <div style={{ minWidth: 150 }}>
                    <label className="form-label">De</label>
                    <input type="date" className="form-input" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
                </div>
                <div style={{ minWidth: 150 }}>
                    <label className="form-label">Até</label>
                    <input type="date" className="form-input" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ q: '', action: '', level: '', date_from: '', date_to: '' }); setPage(1); }}>
                    <span className="material-icons-round">filter_list_off</span> Limpar
                </button>
            </div>

            {/* Tabela */}
            <div className="table-wrap">
                <table>
                    <thead><tr>
                        <th style={{ width: 24 }}></th>
                        <th>Ação</th><th>Usuário</th><th>Entidade</th><th>IP</th><th>Data/Hora</th><th></th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum log encontrado</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} style={{ borderLeft: `3px solid ${LEVEL_COLORS[log.level]}` }}>
                                <td><span className="material-icons-round" style={{ fontSize: 16, color: LEVEL_COLORS[log.level] }}>{LEVEL_ICONS[log.level]}</span></td>
                                <td>
                                    <span style={{ background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{log.user_name || <span style={{ color: 'var(--text-muted)' }}>Anônimo</span>}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {log.entity ? `${log.entity}${log.entity_id ? ` #${log.entity_id}` : ''}` : '—'}
                                </td>
                                <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ip_address || '—'}</td>
                                <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                </td>
                                <td>
                                    {log.details && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLog(log)}>
                                            <span className="material-icons-round" style={{ fontSize: 16 }}>data_object</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            {pagination?.pages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_left</span></button>
                    {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + Math.max(1, page - 3))
                        .filter(p => p <= pagination.pages)
                        .map(p => <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>)}
                    <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}><span className="material-icons-round" style={{ fontSize: 18 }}>chevron_right</span></button>
                </div>
            )}

            {/* Modal detalhe do log */}
            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{selectedLog.action}</h3>
                            <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '0.82rem', overflowX: 'auto', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                {JSON.stringify(selectedLog.details, null, 2)}
                            </pre>
                            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>User-Agent: {selectedLog.user_agent || '—'}</span>
                                <span>ID: #{selectedLog.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
