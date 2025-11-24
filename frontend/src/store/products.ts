import { create } from 'zustand';
import { api } from '../lib/api';
import type { Product } from '../types';

type ProductsState = {
	items: Product[];
	loading: boolean;
	error: string | null;
	list: () => Promise<void>;
	create: (payload: { name: string; quantity: number }) => Promise<void>;
	update: (id: string, payload: Partial<Pick<Product, 'name' | 'quantity'>>) => Promise<void>;
	remove: (id: string) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
	items: [],
	loading: false,
	error: null,
	async list() {
		set({ loading: true, error: null });
		try {
			const response = await api.get<{ success: boolean; data: Product[]; pagination: any }>('/products');
			set({ items: response.data.data, loading: false });
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Falha ao buscar produtos', loading: false });
		}
	},
	async create(payload: { name: string; quantity: number }) {
		await api.post('/products', payload);
		await get().list();
	},
	async update(id: string, payload: Partial<Pick<Product, 'name' | 'quantity'>>) {
		await api.put(`/products/${id}`, payload);
		await get().list();
	},
	async remove(id: string) {
		await api.delete(`/products/${id}`);
		await get().list();
	},
})); 