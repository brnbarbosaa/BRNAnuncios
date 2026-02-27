import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ClientLayout.css';

const navItems = [
    { to: '/cliente/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/cliente/meu-anuncio', icon: 'store', label: 'Meu Anúncio' },
    { to: '/cliente/estatisticas', icon: 'bar_chart', label: 'Estatísticas' },
    { to: '/cliente/galeria', icon: 'photo_library', label: 'Galeria' },
    { to: '/cliente/horarios', icon: 'schedule', label: 'Horários' },
    { to: '/cliente/perfil', icon: 'person', label: 'Perfil' },
];

export default function ClientLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <div className="client-shell">
            <aside className={`client-sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="client-brand">
                    <span className="material-icons-round brand-icon">storefront</span>
                    <span className="brand-name">BRN Anúncios</span>
                </div>
                <nav className="client-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `client-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <span className="material-icons-round">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="client-sidebar-footer">
                    <div className="client-user">
                        <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Cliente</span>
                        </div>
                    </div>
                    <button className="client-logout" onClick={handleLogout}>
                        <span className="material-icons-round">logout</span>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            <div className="client-content">
                <header className="client-topbar">
                    <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <span className="material-icons-round">menu</span>
                    </button>
                    <NavLink to="/" className="btn btn-ghost btn-sm" target="_blank">
                        <span className="material-icons-round" style={{ fontSize: 16 }}>open_in_new</span>
                        Ver meu anúncio
                    </NavLink>
                </header>
                <main className="client-main">
                    <Outlet />
                </main>
            </div>

            {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
        </div>
    );
}
