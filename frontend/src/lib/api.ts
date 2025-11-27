import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
	timeout: 120000, // 2 minutos para operações de IA
	headers: {
		'Content-Type': 'application/json',
	},
});

// Interceptor para tratamento global de erros
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token expirado - redirecionar para login
			localStorage.removeItem('auth_token');
			window.location.href = '/login';
		} else if (error.response?.status >= 500) {
			// Erro do servidor - redirecionar para página de erro
			window.location.href = '/error';
		} else if (!error.response) {
			// Erro de rede/conexão
			console.error('Erro de rede:', error.message);
		}
		return Promise.reject(error);
	}
);
 
export function setAuthToken(token: string | null) {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		console.log('Token definido:', token.substring(0, 20) + '...');
	} else {
		delete api.defaults.headers.common['Authorization'];
		console.log('Token removido');
	}
} 