import { useState, useEffect } from 'react';
import api from '../../services/api';

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const DEFAULT_HOURS = DAYS.map((_, i) => ({
    day_of_week: i,
    open_time: '08:00',
    close_time: '18:00',
    closed: i === 0 || i === 6,
}));

export default function ClientHorarios() {
    const [business, setBusiness] = useState(null);
    const [hours, setHours] = useState(DEFAULT_HOURS);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        api.get('/client/business').then(r => {
            setBusiness(r.data.business);
            if (r.data.hours?.length > 0) {
                const merged = DEFAULT_HOURS.map(d => {
                    const found = r.data.hours.find(h => h.day_of_week === d.day_of_week);
                    return found ? { ...d, ...found } : d;
                });
                setHours(merged);
            }
        }).finally(() => setLoading(false));
    }, []);

    const setHour = (day, key, val) =>
        setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, [key]: val } : h));

    const copyToAll = (src) => {
        const base = hours.find(h => h.day_of_week === src);
        setHours(prev => prev.map(h => ({ ...h, open_time: base.open_time, close_time: base.close_time })));
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/client/business/hours/${business.id}`, { hours });
            setAlert({ type: 'success', msg: '✅ Horários salvos com sucesso!' });
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!business) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Nenhum negócio vinculado.</div>;

    return (
        <div>
            <div className="page-header">
                <div><h1>Horários de Funcionamento</h1><p>Configure quando seu negócio está aberto</p></div>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                    {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar horários</>}
                </button>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {hours.map((h, i) => (
                    <div key={h.day_of_week} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < 6 ? '1px solid var(--border-light)' : 'none', flexWrap: 'wrap' }}>

                        {/* Dia */}
                        <div style={{ width: 140, fontWeight: 600, color: h.closed ? 'var(--text-muted)' : 'var(--text-primary)', flexShrink: 0 }}>
                            {DAYS[h.day_of_week]}
                        </div>

                        {/* Toggle switch */}
                        <label className="toggle-switch" title={h.closed ? 'Clique para abrir' : 'Clique para fechar'}>
                            <input
                                type="checkbox"
                                checked={!h.closed}
                                onChange={e => setHour(h.day_of_week, 'closed', !e.target.checked)}
                            />
                            <span className="toggle-track">
                                <span className="toggle-thumb" />
                            </span>
                            <span className="toggle-label" style={{ color: h.closed ? 'var(--danger)' : 'var(--success)' }}>
                                {h.closed ? 'Fechado' : 'Aberto'}
                            </span>
                        </label>

                        {/* Horários */}
                        {!h.closed ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="time" className="form-input" style={{ width: 120 }} value={h.open_time} onChange={e => setHour(h.day_of_week, 'open_time', e.target.value)} />
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>até</span>
                                    <input type="time" className="form-input" style={{ width: 120 }} value={h.close_time} onChange={e => setHour(h.day_of_week, 'close_time', e.target.value)} />
                                </div>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyToAll(h.day_of_week)} title="Copiar para todos os dias">
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>content_copy</span>
                                    Copiar para todos
                                </button>
                            </>
                        ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fechado este dia</span>
                        )}
                    </div>
                ))}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 12 }}>
                <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle' }}>info</span>
                {' '}Use o switch para marcar dias abertos/fechados. "Copiar para todos" aplica o mesmo horário em todos os dias.
            </p>
        </div>
    );
}
