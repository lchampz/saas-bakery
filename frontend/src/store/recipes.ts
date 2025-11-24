import { create } from 'zustand';
import { api } from '../lib/api';
import type { Recipe } from '../types';

type RecipesState = {
	items: Recipe[];
	loading: boolean;
	error: string | null;
	list: () => Promise<void>;
	create: (payload: { name: string; ingredients: Array<{ productId: string; amount: number }> }) => Promise<void>;
	update: (id: string, payload: Partial<{ name: string; ingredients: Array<{ productId: string; amount: number }> }>) => Promise<void>;
	remove: (id: string) => Promise<void>;
	prepare: (id: string, qty?: number) => Promise<void>;
};

export const useRecipesStore = create<RecipesState>((set, get) => ({
	items: [],
	loading: false,
	error: null,
	async list() {
		set({ loading: true });
		try {
			const { data } = await api.get<Recipe[]>('/recipes');
			set({ items: data, loading: false });
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Failed to fetch recipes', loading: false });
		}
	},
	async create(payload: { name: string; ingredients: Array<{ productId: string; amount: number }> }) {
		await api.post('/recipes', payload);
		await get().list();
	},
	async update(id: string, payload: Partial<{ name: string; ingredients: Array<{ productId: string; amount: number }> }>) {
		await api.put(`/recipes/${id}`, payload);
		await get().list();
	},
	async remove(id: string) {
		await api.delete(`/recipes/${id}`);
		await get().list();
	},
	async prepare(id: string, qty: number = 1) {
		await api.post(`/recipes/${id}/prepare`, null, { params: { qty } });
		await get().list();
	},
})); 