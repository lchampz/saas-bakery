import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { api, setAuthToken } from '../lib/api';
import type { User } from '../types';

type AuthState = {
	token: string | null;
	user: User | null;
	loading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
	fetchMe: () => Promise<void>;
};

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
if (initialToken) {
	console.log('Token inicial carregado:', initialToken.substring(0, 20) + '...');
	setAuthToken(initialToken);
}

const authStoreCreator: StateCreator<AuthState> = (set, get) => ({
	token: initialToken,
	user: null,
	loading: false,
	error: null,
	async login(email: string, password: string) {
		set({ loading: true, error: null });
		try {
			const response = await api.post('/auth/login', { email, password });
			const { data } = response;
			
			// Verificar se a resposta tem o formato esperado
			if (data.success && data.data) {
				const { token, user } = data.data;
				setAuthToken(token);
				localStorage.setItem('auth_token', token);
				set({ token, user, loading: false });
			} else {
				// Fallback para formato antigo
				setAuthToken(data.token);
				localStorage.setItem('auth_token', data.token);
				set({ token: data.token, user: data.user, loading: false });
			}
		} catch (error) {
			const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao fazer login';
			set({ error: errorMessage, loading: false });
			throw new Error(errorMessage);
		}
	},
	async register(email: string, password: string) {
		set({ loading: true, error: null });
		try {
			await api.post('/auth/register', { email, password });
			await get().login(email, password);
		} catch (error) {
			const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Register failed';
			set({ error: errorMessage, loading: false });
		}
	},
	logout() {
		setAuthToken(null);
		localStorage.removeItem('auth_token');
		set({ token: null, user: null });
	},
	async fetchMe() {
		try {
			const { data } = await api.get('/auth/me');
			
			// Verificar se a resposta tem o formato esperado
			if (data.success && data.data) {
				set({ user: data.data.user });
			} else {
				// Fallback para formato antigo
				set({ user: data.user });
			}
		} catch {
			set({ token: null, user: null });
		}
	},
});

export const useAuthStore = create<AuthState>(authStoreCreator); 