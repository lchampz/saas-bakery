import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type AnalyticsData = {
	salesData: Array<{ date: string; revenue: number; orders: number; products: number }>;
	inventoryData: Array<{ name: string; quantity: number; minLevel: number; status: string }>;
	recipePerformance: Array<{ name: string; popularity: number; profitMargin: number }>;
	costAnalysis: Array<{ category: string; amount: number; percentage: number }>;
	totalRevenue: number;
	totalOrders: number;
	totalProducts: number;
};

export function useAnalytics(days: number = 30) {
	return useQuery({
		queryKey: ['analytics', days],
		queryFn: async () => {
			const { data } = await api.get<{ success: boolean; data: AnalyticsData }>(`/reports/analytics?days=${days}`);
			if (!data.success) {
				throw new Error('Failed to fetch analytics');
			}
			return data.data;
		},
		staleTime: 1000 * 60 * 2, // 2 minutos
	});
}

