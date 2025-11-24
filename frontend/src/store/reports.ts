import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { api } from '../lib/api';
import type { Product, Consumption } from '../types';

type Capability = { recipeId: string; name: string; possible: number };

type ReportsState = {
	stock: Product[];
	capability: Capability[];
	history: Consumption[];
	loading: boolean;
	error: string | null;
	fetchStock: () => Promise<void>;
	fetchCapability: () => Promise<void>;
	fetchHistory: () => Promise<void>;
};

const reportsStoreCreator: StateCreator<ReportsState> = (set) => ({
	stock: [],
	capability: [],
	history: [],
	loading: false,
	error: null,
	async fetchStock() {
		set({ loading: true });
		try {
			const { data } = await api.get<Product[]>('/reports/stock');
			set({ stock: data, loading: false });
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Failed to fetch stock', loading: false });
		}
	},
	async fetchCapability() {
		set({ loading: true });
		try {
			const { data } = await api.get<Capability[]>('/reports/capability');
			set({ capability: data, loading: false });
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Failed to fetch capability', loading: false });
		}
	},
	async fetchHistory() {
		set({ loading: true });
		try {
			const { data } = await api.get<Consumption[]>('/reports/history');
			set({ history: data, loading: false });
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Failed to fetch history', loading: false });
		}
	},
});

export const useReportsStore = create<ReportsState>(reportsStoreCreator); 