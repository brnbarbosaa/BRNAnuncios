import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import BusinessCard from '../../components/BusinessCard';
import '../../components/BusinessCard.css';

export default function Anuncios() {
    const [businesses, setBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        params.set('page', page);

        Promise.all([
            api.get(`/public/businesses?${params}`),
            api.get('/public/categories'),
        ]).then(([biz, cats]) => {
            setBusinesses(biz.data.businesses);
            setPagination(biz.data.pagination);
            setCategories(cats.data);
        }).finally(() => setLoading(false));
    }, [q, category, page]);

    const update = (key, val) => {
        const next = new URLSearchParams(searchParams);
        if (val) { next.set(key, val); } else { next.delete(key); }
        next.delete('page');
        setSearchParams(next);
    };

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            {/* ── Cabeçalho ── */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', padding: '32px 0' }}>
                <div className="container">
                    <h1 style={{ marginBottom: 8 }}>🔍 Todos os <span style={{ color: 'var(--primary-light)' }}>Anúncios</span></h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {pagination ? `${pagination.total} negócio(s) encontrado(s)` : 'Buscando...'}
                    </p>

                    {/* Barra de busca */}
                    <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 20 }}>search</span>
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: 40 }}
                                placeholder="Buscar por nome, serviço..."
                                defaultValue={q}
                                onKeyDown={e => e.key === 'Enter' && update('q', e.target.value)}
                                onBlur={e => update('q', e.target.value)}
                            />
                        </div>
                        <select className="form-select" style={{ width: 220 }} value={category} onChange={e => update('category', e.target.value)}>
                            <option value="">Todas as categorias</option>
                            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Filtros de categoria em chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                        <button className={`tag ${!category ? 'active-tag' : ''}`} onClick={() => update('category', '')}>
                            Todos
                        </button>
                        {categories.map(c => (
                            <button key={c.id}
                                className={`tag ${category === c.slug ? 'active-tag' : ''}`}
                                onClick={() => update('category', category === c.slug ? '' : c.slug)}
                                style={category === c.slug ? { background: `${c.color}22`, borderColor: `${c.color}55`, color: c.color } : {}}
                            >
                                <span className="material-icons-round" style={{ fontSize: 13 }}>{c.icon}</span>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="container section">
                {loading ? (
                    <div className="page-loading"><div className="spinner" /></div>
                ) : businesses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                        <span className="material-icons-round" style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>search_off</span>
                        <h3 style={{ marginBottom: 8 }}>Nenhum anúncio encontrado</h3>
                        <p>Tente outros termos ou remova os filtros.</p>
                    </div>
                ) : (
                    <div className="businesses-grid">
                        {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
                    </div>
                )}

                {/* Paginação */}
                {pagination && pagination.pages > 1 && (
                    <div className="pagination">
                        <button className="page-btn" disabled={page <= 1}
                            onClick={() => update('page', page - 1)}>
                            <span className="material-icons-round" style={{ fontSize: 18 }}>chevron_left</span>
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                            .filter(p => Math.abs(p - page) <= 2)
                            .map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`}
                                    onClick={() => update('page', p)}>{p}</button>
                            ))}
                        <button className="page-btn" disabled={page >= pagination.pages}
                            onClick={() => update('page', page + 1)}>
                            <span className="material-icons-round" style={{ fontSize: 18 }}>chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            <style>{`.active-tag { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.4) !important; color: var(--primary-light) !important; }`}</style>
        </div>
    );
}
