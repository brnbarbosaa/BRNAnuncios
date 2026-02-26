import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminConfiguracoes() {
    const [settings, setSettings] = useState([]);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        api.get('/admin/settings').then(r => {
            setSettings(r.data);
            setForm(Object.fromEntries(r.data.map(s => [s.key, s.value || ''])));
        });
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', { settings: Object.entries(form).map(([key, value]) => ({ key, value })) });
            setAlert({ type: 'success', msg: 'Configurações salvas com sucesso!' });
        } catch (err) { setAlert({ type: 'error', msg: err.message }); }
        finally { setSaving(false); }
    };

    const labels = {
        site_name: 'Nome do site',
        site_slogan: 'Slogan da home',
        contact_email: 'E-mail de contato',
        ads_per_page: 'Anúncios por página',
        carousel_interval: 'Intervalo do carrossel (ms)',
        highlight_cards_count: 'Qtd. de cards de destaque',
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Configurações</h1><p>Parâmetros gerais do sistema</p></div>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                    {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span className="material-icons-round">save</span> Salvar configurações</>}
                </button>
            </div>
            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {settings.map(s => (
                    <div key={s.key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                        <label className="form-label">{labels[s.key] || s.key}</label>
                        {s.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.description}</p>}
                        <input className="form-input" value={form[s.key] || ''} onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))} />
                    </div>
                ))}
            </div>
        </div>
    );
}
