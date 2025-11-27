import React from 'react';
import { Button } from './button';
import { Select } from './select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface PaginationProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	className?: string;
}

export function Pagination({ pagination, onPageChange, onLimitChange, className }: PaginationProps) {
	const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

	if (totalPages <= 1) return null;

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			// Mostrar todas as páginas se houver poucas
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Sempre mostrar primeira página
			pages.push(1);

			if (page > 3) {
				pages.push('...');
			}

			// Mostrar páginas ao redor da página atual
			const start = Math.max(2, page - 1);
			const end = Math.min(totalPages - 1, page + 1);

			for (let i = start; i <= end; i++) {
				if (i !== 1 && i !== totalPages) {
					pages.push(i);
				}
			}

			if (page < totalPages - 2) {
				pages.push('...');
			}

			// Sempre mostrar última página
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const startItem = (page - 1) * limit + 1;
	const endItem = Math.min(page * limit, total);

	return (
		<div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 mt-6', className)}>
			{/* Informações */}
			<div className="text-sm text-gray-600">
				Mostrando <span className="font-medium text-gray-900">{startItem}</span> a{' '}
				<span className="font-medium text-gray-900">{endItem}</span> de{' '}
				<span className="font-medium text-gray-900">{total}</span> itens
			</div>

			{/* Controles de paginação */}
			<div className="flex items-center gap-2">
				{/* Primeira página */}
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(1)}
					disabled={!hasPrev}
					className="px-2"
					aria-label="Primeira página"
				>
					<ChevronsLeft className="w-4 h-4" />
				</Button>

				{/* Página anterior */}
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={!hasPrev}
					className="px-2"
					aria-label="Página anterior"
				>
					<ChevronLeft className="w-4 h-4" />
				</Button>

				{/* Números de página */}
				<div className="flex items-center gap-1">
					{getPageNumbers().map((pageNum, index) => {
						if (pageNum === '...') {
							return (
								<span key={`ellipsis-${index}`} className="px-2 text-gray-400">
									...
								</span>
							);
						}

						const pageNumber = pageNum as number;
						const isActive = pageNumber === page;

						return (
							<Button
								key={pageNumber}
								variant={isActive ? 'default' : 'outline'}
								size="sm"
								onClick={() => onPageChange(pageNumber)}
								className={cn(
									'min-w-[2.5rem]',
									isActive && 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
								)}
								aria-label={`Página ${pageNumber}`}
								aria-current={isActive ? 'page' : undefined}
							>
								{pageNumber}
							</Button>
						);
					})}
				</div>

				{/* Próxima página */}
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={!hasNext}
					className="px-2"
					aria-label="Próxima página"
				>
					<ChevronRight className="w-4 h-4" />
				</Button>

				{/* Última página */}
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(totalPages)}
					disabled={!hasNext}
					className="px-2"
					aria-label="Última página"
				>
					<ChevronsRight className="w-4 h-4" />
				</Button>
			</div>

			{/* Seletor de limite por página */}
			{onLimitChange && (
				<div className="flex items-center gap-2">
					<label className="text-sm text-gray-600">Itens por página:</label>
					<Select
						value={limit.toString()}
						onChange={(e) => onLimitChange(Number(e.target.value))}
						className="w-20"
					>
						<option value="10">10</option>
						<option value="20">20</option>
						<option value="50">50</option>
						<option value="100">100</option>
					</Select>
				</div>
			)}
		</div>
	);
}

