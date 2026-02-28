import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientGaleria() {
    const { user } = useAuth();
    const [business, setBusiness] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [planFeatures, setPlanFeatures] = useState([]);
    const [planLimits, setPlanLimits] = useState({});

    const load = () => {
        api.get('/client/business').then(r => {
            setBusiness(r.data.business);
            setImages(r.data.images || []);
            setPlanFeatures(r.data.planFeatures || []);
            setPlanLimits(r.data.planLimits || {});
        }).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const hasFeat = (f) => planFeatures.includes(f);

    const uploadLogo = async (file) => {
        if (!file || !business) return;
        const fd = new FormData();
        fd.append('logo', file);
        setUploading(true);
        try {
            await api.post(`/client/business/logo/${business.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAlert({ type: 'success', msg: '✅ Logo atualizado!' });
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.response?.data?.error || err.message }); }
        finally { setUploading(false); }
    };

    const uploadGallery = async (files) => {
        if (!files.length || !business) return;
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('images', f));
        setUploading(true);
        try {
            await api.post(`/client/business/gallery/${business.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAlert({ type: 'success', msg: `✅ ${files.length} foto(s) adicionada(s)!` });
            load();
        } catch (err) { setAlert({ type: 'error', msg: err.response?.data?.error || err.message }); }
        finally { setUploading(false); }
    };

    const deleteImage = async (id) => {
        if (!window.confirm('Remover esta imagem?')) return;
        try { await api.delete(`/client/business/gallery/${id}`); load(); }
        catch (err) { setAlert({ type: 'error', msg: err.response?.data?.error || err.message }); }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!business) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Nenhum negócio vinculado.</div>;

    const galleryLimit = planLimits.gallery_photos || 0;

    return (
        <div>
            <div className="page-header">
                <div><h1>Galeria</h1><p>Adicione fotos do seu negócio para atrair mais clientes</p></div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}><span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>{alert.msg}</div>}

            {/* Logo — disponível para todos */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>🖼️ Logo / Capa Principal</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 100, height: 100, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', flexShrink: 0 }}>
                        {business.logo ? <img src={business.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="material-icons-round" style={{ fontSize: 36, color: 'var(--text-muted)' }}>add_photo_alternate</span>}
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                            Recomendado: 400×400px. Formatos: JPEG, PNG, WebP. Máx: 5MB.
                        </p>
                        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                            <span className="material-icons-round">upload</span>
                            {uploading ? 'Enviando...' : 'Selecionar logo'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadLogo(e.target.files[0])} disabled={uploading} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Galeria — Premium only */}
            {!hasFeat('gallery') ? (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)',
                    padding: '40px 32px', textAlign: 'center',
                }}>
                    <span className="material-icons-round" style={{ fontSize: 52, color: 'var(--accent)', display: 'block', marginBottom: 14 }}>photo_library</span>
                    <h3 style={{ marginBottom: 8 }}>Galeria de Fotos</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 4, maxWidth: 420, margin: '0 auto 8px' }}>
                        Adicione até {galleryLimit || 5} fotos do seu negócio para atrair mais clientes e mostrar seus produtos/serviços.
                    </p>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', padding: '4px 14px', fontWeight: 700 }}>
                        <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>workspace_premium</span>
                        Disponível no plano Premium
                    </span>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem' }}>📸 Galeria de Fotos ({images.length}/{galleryLimit})</h3>
                        {images.length < galleryLimit && (
                            <label className="btn btn-primary btn-sm" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                                {uploading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><span className="material-icons-round">add_photo_alternate</span> Adicionar fotos</>}
                                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => uploadGallery(e.target.files)} disabled={uploading} />
                            </label>
                        )}
                    </div>

                    {images.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <span className="material-icons-round" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>photo_library</span>
                            <p>Nenhuma foto ainda. Adicione imagens do seu negócio!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                            {images.map(img => (
                                <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                    <img src={img.path} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => deleteImage(img.id)}
                                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}>
                                        <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 16 }}>Máximo {galleryLimit} fotos. Cada foto até 10MB. Formatos: JPEG, PNG, WebP.</p>
                </div>
            )}
        </div>
    );
}
