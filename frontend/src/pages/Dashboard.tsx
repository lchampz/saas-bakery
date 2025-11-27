import React, { useEffect, useMemo } from 'react';
import { useReportsStore } from '../store/reports';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { AnalyticsDashboard } from '../components/ui/analytics-dashboard';
import { MetricCardSkeleton, ListItemSkeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

export default function Dashboard() {
	const { stock, capability, history, fetchStock, fetchCapability, fetchHistory, loading } = useReportsStore();

	useEffect(() => {
		let cancelled = false;
		
		const loadData = async () => {
			try {
				await Promise.all([fetchStock(), fetchCapability(), fetchHistory()]);
			} catch {
				if (!cancelled) {
					toast.error('Falha ao carregar dashboard');
				}
			}
		};

		loadData();

		return () => {
			cancelled = true;
		};
	}, []);

	// Calcular métricas
	const metrics = useMemo(() => {
		const totalProducts = stock.length;
		const totalStock = stock.reduce((sum, p) => sum + p.quantity, 0);
		const lowStockProducts = stock.filter(p => p.quantity < 100).length;
		const totalRecipes = capability.length;
		const avgCapability = capability.length > 0 
			? capability.reduce((sum, c) => sum + c.possible, 0) / capability.length 
			: 0;

		return {
			totalProducts,
			totalStock: totalStock.toFixed(0),
			lowStockProducts,
			totalRecipes,
			avgCapability: avgCapability.toFixed(1),
		};
	}, [stock, capability]);

	if (loading) {
		return (
			<div className="space-y-8">
				{/* Header Skeleton */}
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse" />
						<div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
					</div>
					<div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
				</div>

				{/* Analytics Skeleton */}
				<div className="card p-6">
					<div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
				</div>

				{/* Métricas Skeleton */}
				<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<MetricCardSkeleton key={i} />
					))}
				</section>

				{/* Detalhes Skeleton */}
				<section className="grid lg:grid-cols-3 gap-6">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="card p-6">
							<div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse mb-4" />
							<ListItemSkeleton count={5} />
						</div>
					))}
				</section>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
					<p className="text-gray-600">Visão geral da sua confeitaria</p>
				</div>
				<div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
					Última atualização: {new Date().toLocaleTimeString()}
				</div>
			</div>

			{/* Analytics Dashboard */}
			<AnalyticsDashboard />

			{/* Métricas Principais */}
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="card card-hover p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white">
							📦
						</div>
						<div>
							<div className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</div>
							<div className="text-sm text-gray-600">Total de Produtos</div>
						</div>
					</div>
				</div>
				
				<div className="card card-hover p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
							⚖️
						</div>
						<div>
							<div className="text-2xl font-bold text-gray-900">{metrics.totalStock}g</div>
							<div className="text-sm text-gray-600">Estoque Total</div>
						</div>
					</div>
				</div>
				
				<div className="card card-hover p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
							⚠️
						</div>
						<div>
							<div className="text-2xl font-bold text-gray-900">{metrics.lowStockProducts}</div>
							<div className="text-sm text-gray-600">Estoque Baixo</div>
						</div>
					</div>
				</div>
				
				<div className="card card-hover p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
							🍰
						</div>
						<div>
							<div className="text-2xl font-bold text-gray-900">{metrics.totalRecipes}</div>
							<div className="text-sm text-gray-600">Receitas Ativas</div>
						</div>
					</div>
				</div>
			</section>

			{/* Detalhes */}
			<section className="grid lg:grid-cols-3 gap-6">
				<div className="card p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white text-sm">
							📦
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Estoque Detalhado</h3>
					</div>
					<div className="space-y-3 max-h-64 overflow-auto">
						{stock.length === 0 ? (
							<p className="text-sm text-gray-500 text-center py-4">Nenhum produto cadastrado</p>
						) : (
							stock.map((p) => (
								<div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
									<span className="text-sm font-medium text-gray-900">{p.name}</span>
									<span className={`text-xs px-3 py-1 rounded-full font-medium ${
										p.quantity < 100 
											? 'bg-red-100 text-red-700' 
											: 'bg-green-100 text-green-700'
									}`}>
										{p.quantity}g
									</span>
								</div>
							))
						)}
					</div>
				</div>

				<div className="card p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm">
							🍰
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Capacidade de Produção</h3>
					</div>
					<div className="space-y-3 max-h-64 overflow-auto">
						{capability.length === 0 ? (
							<p className="text-sm text-gray-500 text-center py-4">Nenhuma receita cadastrada</p>
						) : (
							capability.map((c) => (
								<div key={c.recipeId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
									<span className="text-sm font-medium text-gray-900">{c.name}</span>
									<span className={`text-xs px-3 py-1 rounded-full font-medium ${
										c.possible > 0 
											? 'bg-green-100 text-green-700' 
											: 'bg-red-100 text-red-700'
									}`}>
										{c.possible}x
									</span>
								</div>
							))
						)}
					</div>
				</div>

				<div className="card p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
							📊
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Histórico Recente</h3>
					</div>
					<div className="space-y-3 max-h-64 overflow-auto">
						{history.length === 0 ? (
							<p className="text-sm text-gray-500 text-center py-4">Nenhuma movimentação</p>
						) : (
							history.slice(0, 10).map((h) => (
								<div key={h.id} className="p-3 bg-gray-50 rounded-lg">
									<div className="text-xs text-gray-500 mb-1">
										{new Date(h.createdAt).toLocaleString()}
									</div>
									<div className="text-sm font-medium text-gray-900">
										<span className="text-red-600">-{h.amount}g</span> {h.product.name}
									</div>
									<div className="text-xs text-gray-600">{h.reason}</div>
								</div>
							))
						)}
					</div>
				</div>
			</section>
		</div>
	);
} 