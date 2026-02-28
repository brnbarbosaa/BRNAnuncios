import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const navItems = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/admin/anuncios', icon: 'store', label: 'Anúncios' },
    { to: '/admin/requisicoes', icon: 'inbox', label: 'Requisições' },
    { to: '/admin/usuarios', icon: 'people', label: 'Usuários' },
    { to: '/admin/categorias', icon: 'category', label: 'Categorias' },
    { to: '/admin/destaques', icon: 'star', label: 'Destaques' },
    { to: '/admin/planos', icon: 'workspace_premium', label: 'Planos' },
    { to: '/admin/configuracoes', icon: 'settings', label: 'Configurações' },
    { to: '/admin/faq', icon: 'help_outline', label: 'FAQ' },
    { to: '/admin/logs', icon: 'terminal', label: 'Logs do Sistema' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className={`admin-shell ${sidebarOpen ? '' : 'collapsed'}`}>
            {/* ── Sidebar ── */}
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    <span className="brand-icon material-icons-round">storefront</span>
                    {sidebarOpen && <span className="brand-name">BRN Admin</span>}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            <span className="material-icons-round nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {sidebarOpen && (
                        <div className="sidebar-user">
                            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                            <div className="user-info">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role">Administrador</span>
                            </div>
                        </div>
                    )}
                    <button className="nav-item logout-btn" onClick={handleLogout} title="Sair">
                        <span className="material-icons-round nav-icon">logout</span>
                        {sidebarOpen && <span className="nav-label">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* ── Conteúdo ── */}
            <div className="admin-content">
                <header className="admin-topbar">
                    <button className="topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span className="material-icons-round">{sidebarOpen ? 'menu_open' : 'menu'}</span>
                    </button>
                    <div className="topbar-right">
                        <NavLink to="/" target="_blank" className="btn btn-ghost btn-sm">
                            <span className="material-icons-round" style={{ fontSize: 16 }}>open_in_new</span>
                            Ver Site
                        </NavLink>
                    </div>
                </header>
                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
