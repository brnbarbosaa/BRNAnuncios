import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
});

// Interceptor de request: injeta token se existir
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('brn_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor de response: padroniza erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Erro desconhecido';

        // Token expirado — logout automático
        if (error.response?.status === 401) {
            localStorage.removeItem('brn_token');
            delete api.defaults.headers.common['Authorization'];
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default api;
