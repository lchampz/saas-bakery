import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { api } from '../lib/api';
import type { Product, Consumption } from '../types';

type Capability = { recipeId: string; name: string; possible: number };

type AnalyticsData = {
	salesData: Array<{ date: string; revenue: number; orders: number; products: number }>;
	inventoryData: Array<{ name: string; quantity: number; minLevel: number; status: string }>;
	recipePerformance: Array<{ name: string; popularity: number; profitMargin: number }>;
	costAnalysis: Array<{ category: string; amount: number; percentage: number }>;
	totalRevenue: number;
	totalOrders: number;
	totalProducts: number;
};

type ReportsState = {
	stock: Product[];
	capability: Capability[];
	history: Consumption[];
	analytics: AnalyticsData | null;
	loading: boolean;
	error: string | null;
	fetchStock: () => Promise<void>;
	fetchCapability: () => Promise<void>;
	fetchHistory: () => Promise<void>;
	fetchAnalytics: (days?: number) => Promise<void>;
};

const reportsStoreCreator: StateCreator<ReportsState> = (set, get) => ({
	stock: [],
	capability: [],
	history: [],
	analytics: null,
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
	async fetchAnalytics(days: number = 30) {
		// Evitar requisições duplicadas
		const currentState = get();
		if (currentState.loading) {
			return Promise.resolve();
		}

		set({ loading: true, error: null });
		try {
			const { data } = await api.get<{ success: boolean; data: AnalyticsData }>(`/reports/analytics?days=${days}`);
			if (data.success) {
				set({ analytics: data.data, loading: false });
			} else {
				set({ error: 'Failed to fetch analytics', loading: false });
			}
		} catch (e: unknown) {
			const error = e as { response?: { data?: { message?: string } } };
			set({ error: error?.response?.data?.message ?? 'Failed to fetch analytics', loading: false });
		}
	},
});

export const useReportsStore = create<ReportsState>(reportsStoreCreator); 