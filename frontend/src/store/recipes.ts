import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { api } from '../lib/api';
import type { Recipe } from '../types';

type AIRecipeGeneration = {
	description: string;
	availableProducts?: string[];
	servingSize?: number;
	dietaryRestrictions?: string[];
};

type GeneratedRecipe = {
	name: string;
	ingredients: Array<{ productId: string; productName: string; amount: number; unit: string }>;
	instructions: string;
	estimatedCost: number;
	servingSize: number;
};

type RecipesState = {
	items: Recipe[];
	loading: boolean;
	error: string | null;
	list: () => Promise<void>;
	create: (payload: { name: string; ingredients: Array<{ productId: string; amount: number }>; servingSize?: number; instructions?: string }) => Promise<void>;
	update: (id: string, payload: Partial<{ name: string; ingredients: Array<{ productId: string; amount: number }> }>) => Promise<void>;
	remove: (id: string) => Promise<void>;
	prepare: (id: string, qty?: number) => Promise<void>;
	generateWithAI: (payload: AIRecipeGeneration) => Promise<GeneratedRecipe>;
	scale: (id: string, multiplier: number) => Promise<any>;
};

const recipesStoreCreator: StateCreator<RecipesState> = (set, get) => ({
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
	async create(payload: { name: string; ingredients: Array<{ productId: string; amount: number }>; servingSize?: number; instructions?: string }) {
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
		await api.post(`/recipes/${id}/prepare?qty=${qty}`);
		await get().list();
	},
	async generateWithAI(payload: AIRecipeGeneration): Promise<GeneratedRecipe> {
		set({ loading: true, error: null });
		try {
			const { data } = await api.post<{ success: boolean; data: GeneratedRecipe }>('/ai-recipes/generate', payload);
			set({ loading: false });
			if (data.success) {
				return data.data;
			}
			throw new Error('Falha ao gerar receita');
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Falha ao gerar receita', loading: false });
			throw error;
		}
	},
	async scale(id: string, multiplier: number) {
		set({ loading: true });
		try {
			const { data } = await api.post(`/recipes/${id}/scale`, { multiplier });
			set({ loading: false });
			return data;
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Falha ao escalar receita', loading: false });
			throw error;
		}
	},
});

export const useRecipesStore = create<RecipesState>(recipesStoreCreator); 