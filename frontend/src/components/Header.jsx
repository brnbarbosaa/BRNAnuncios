import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
    const { user, isAdmin, isClient } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-inner container">
                {/* Logo */}
                <Link to="/" className="site-logo">
                    <span className="material-icons-round logo-icon">storefront</span>
                    <span className="logo-text">BRN <span>Anúncios</span></span>
                </Link>

                {/* Nav desktop */}
                <nav className="header-nav">
                    <Link to="/" className="header-link">Home</Link>
                    <Link to="/anuncios" className="header-link">Anúncios</Link>
                    <Link to="/solicitar-cadastro" className="header-link">Anunciar</Link>
                </nav>

                {/* Ações */}
                <div className="header-actions">
                    {user ? (
                        <>
                            {isAdmin() && (
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard')}>
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>admin_panel_settings</span>
                                    Admin
                                </button>
                            )}
                            {isClient() && (
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cliente/dashboard')}>
                                    <span className="material-icons-round" style={{ fontSize: 16 }}>person</span>
                                    Minha Área
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="header-link hide-sm">Entrar</Link>
                            <Link to="/solicitar-cadastro" className="btn btn-primary btn-sm">
                                <span className="material-icons-round" style={{ fontSize: 16 }}>add_business</span>
                                Anunciar
                            </Link>
                        </>
                    )}
                    <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        <span className="material-icons-round">{mobileOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="mobile-menu">
                    <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link to="/anuncios" className="mobile-link" onClick={() => setMobileOpen(false)}>Anúncios</Link>
                    <Link to="/solicitar-cadastro" className="mobile-link" onClick={() => setMobileOpen(false)}>Anunciar</Link>
                    {!user && <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Entrar</Link>}
                </div>
            )}
        </header>
    );
}
