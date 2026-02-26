import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Recarrega usuário do token existente
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('brn_token');
        if (!token) { setLoading(false); return; }
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const { data } = await api.get('/auth/me');
            setUser(data);
        } catch {
            localStorage.removeItem('brn_token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('brn_token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch (_) { }
        localStorage.removeItem('brn_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isClient = () => user?.role === 'client';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isClient, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
}
