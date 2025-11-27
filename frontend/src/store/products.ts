import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { api } from '../lib/api';
import type { Product } from '../types';

type PaginationInfo = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
};

type ProductsState = {
	items: Product[];
	pagination: PaginationInfo | null;
	loading: boolean;
	error: string | null;
	list: (page?: number, limit?: number) => Promise<void>;
	create: (payload: { name: string; quantity: number; unit?: string; pricePerGram?: number }) => Promise<void>;
	update: (id: string, payload: Partial<Pick<Product, 'name' | 'quantity' | 'unit' | 'pricePerGram'>>) => Promise<void>;
	remove: (id: string) => Promise<void>;
};

const productsStoreCreator: StateCreator<ProductsState> = (set, get) => ({
	items: [],
	pagination: null,
	loading: false,
	error: null,
	async list(page = 1, limit = 10) {
		set({ loading: true, error: null });
		try {
			const response = await api.get<{ 
				success: boolean; 
				data: Product[]; 
				pagination: PaginationInfo 
			}>(`/products?page=${page}&limit=${limit}`);
			set({ 
				items: response.data.data, 
				pagination: response.data.pagination,
				loading: false 
			});
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Falha ao buscar produtos', loading: false });
		}
	},
	async create(payload: { name: string; quantity: number; unit?: string; pricePerGram?: number }) {
		await api.post('/products', payload);
		await get().list();
	},
	async update(id: string, payload: Partial<Pick<Product, 'name' | 'quantity' | 'unit' | 'pricePerGram'>>) {
		await api.put(`/products/${id}`, payload);
		await get().list();
	},
	async remove(id: string) {
		await api.delete(`/products/${id}`);
		await get().list();
	},
});

export const useProductsStore = create<ProductsState>(productsStoreCreator); 