import { Link } from 'react-router-dom';
export default function NotFound() {
    return (
        <div style={{ minHeight: '80vh', paddingTop: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px' }}>
            <div>
                <div style={{ fontSize: '8rem', fontFamily: 'var(--font-display)', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>404</div>
                <h2 style={{ margin: '16px 0 8px' }}>Página não encontrada</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>O endereço que você acessou não existe ou foi movido.</p>
                <Link to="/" className="btn btn-primary"><span className="material-icons-round">home</span> Voltar para a Home</Link>
            </div>
        </div>
    );
}
