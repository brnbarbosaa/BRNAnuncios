import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts públicos
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ClientLayout from './components/layouts/ClientLayout';

// Páginas públicas
import Home from './pages/public/Home';
import Anuncios from './pages/public/Anuncios';
import AnuncioDetail from './pages/public/AnuncioDetail';
import SolicitarCadastro from './pages/public/SolicitarCadastro';
import LoginPage from './pages/public/Login';
import NotFound from './pages/public/NotFound';

// Área do cliente
import ClientDashboard from './pages/client/Dashboard';
import ClientAnuncio from './pages/client/MeuAnuncio';
import ClientGaleria from './pages/client/Galeria';
import ClientHorarios from './pages/client/Horarios';
import ClientPerfil from './pages/client/Perfil';

// Área do admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnuncios from './pages/admin/Anuncios';
import AdminAnuncioEdit from './pages/admin/AnuncioEdit';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminRequisicoes from './pages/admin/Requisicoes';
import AdminCategorias from './pages/admin/Categorias';
import AdminDestaques from './pages/admin/Destaques';
import AdminLogs from './pages/admin/Logs';
import AdminConfiguracoes from './pages/admin/Configuracoes';

// Guards de rota
function PrivateRoute({ children, role }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ── Área Pública ── */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/anuncios" element={<Anuncios />} />
                        <Route path="/anuncio/:slug" element={<AnuncioDetail />} />
                        <Route path="/solicitar-cadastro" element={<SolicitarCadastro />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* ── Área do Cliente ── */}
                    <Route path="/cliente" element={<PrivateRoute role="client"><ClientLayout /></PrivateRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<ClientDashboard />} />
                        <Route path="meu-anuncio" element={<ClientAnuncio />} />
                        <Route path="galeria" element={<ClientGaleria />} />
                        <Route path="horarios" element={<ClientHorarios />} />
                        <Route path="perfil" element={<ClientPerfil />} />
                    </Route>

                    {/* ── Área do Admin ── */}
                    <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="anuncios" element={<AdminAnuncios />} />
                        <Route path="anuncios/:id" element={<AdminAnuncioEdit />} />
                        <Route path="usuarios" element={<AdminUsuarios />} />
                        <Route path="requisicoes" element={<AdminRequisicoes />} />
                        <Route path="categorias" element={<AdminCategorias />} />
                        <Route path="destaques" element={<AdminDestaques />} />
                        <Route path="logs" element={<AdminLogs />} />
                        <Route path="configuracoes" element={<AdminConfiguracoes />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
