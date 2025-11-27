import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
	className?: string;
	width?: string | number;
	height?: string | number;
	rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({ className, width, height, rounded = 'md' }: SkeletonProps) {
	const roundedClasses = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		full: 'rounded-full',
	};

	return (
		<div
			className={cn(
				'animate-pulse bg-gray-200',
				roundedClasses[rounded],
				className
			)}
			style={{
				width: width || '100%',
				height: height || '1rem',
			}}
			aria-hidden="true"
		/>
	);
}

// Skeleton para card de produto
export function ProductCardSkeleton() {
	return (
		<div className="card p-6 animate-pulse">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<Skeleton width={48} height={48} rounded="xl" />
					<div className="space-y-2">
						<Skeleton width={120} height={20} />
						<Skeleton width={80} height={16} />
					</div>
				</div>
			</div>
			<div className="space-y-3 mb-4">
				<div className="flex justify-between">
					<Skeleton width={100} height={16} />
					<Skeleton width={80} height={16} />
				</div>
				<div className="flex justify-between">
					<Skeleton width={100} height={16} />
					<Skeleton width={80} height={16} />
				</div>
			</div>
			<div className="flex gap-2">
				<Skeleton width="100%" height={36} rounded="lg" />
				<Skeleton width="100%" height={36} rounded="lg" />
			</div>
			<Skeleton width="100%" height={36} rounded="lg" className="mt-2" />
		</div>
	);
}

// Skeleton para card de receita
export function RecipeCardSkeleton() {
	return (
		<div className="card p-6 animate-pulse">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3 flex-1">
					<Skeleton width={40} height={40} rounded="xl" />
					<div className="flex-1 space-y-2">
						<Skeleton width={150} height={20} />
						<Skeleton width={100} height={16} />
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton width={80} height={32} rounded="lg" />
					<Skeleton width={80} height={32} rounded="lg" />
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton width={100} height={16} className="mb-2" />
				<div className="space-y-2">
					<Skeleton width="100%" height={40} rounded="lg" />
					<Skeleton width="100%" height={40} rounded="lg" />
					<Skeleton width="80%" height={40} rounded="lg" />
				</div>
			</div>
		</div>
	);
}

// Skeleton para métricas do dashboard
export function MetricCardSkeleton() {
	return (
		<div className="card p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-4">
				<Skeleton width={48} height={48} rounded="lg" />
				<div className="flex-1 space-y-2">
					<Skeleton width={120} height={16} />
					<Skeleton width={80} height={24} />
				</div>
			</div>
		</div>
	);
}

// Skeleton para lista de itens
export function ListItemSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
					<Skeleton width={40} height={40} rounded="lg" />
					<div className="flex-1 space-y-2">
						<Skeleton width="60%" height={16} />
						<Skeleton width="40%" height={14} />
					</div>
					<Skeleton width={60} height={32} rounded="lg" />
				</div>
			))}
		</div>
	);
}

// Skeleton para tabela
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
	return (
		<div className="card p-6 animate-pulse">
			<div className="space-y-4">
				{/* Header */}
				<div className="flex gap-4 pb-3 border-b border-gray-200">
					{Array.from({ length: cols }).map((_, i) => (
						<Skeleton key={i} width="100%" height={20} />
					))}
				</div>
				{/* Rows */}
				{Array.from({ length: rows }).map((_, rowIndex) => (
					<div key={rowIndex} className="flex gap-4 py-3">
						{Array.from({ length: cols }).map((_, colIndex) => (
							<Skeleton key={colIndex} width="100%" height={16} />
						))}
					</div>
				))}
			</div>
		</div>
	);
}

