import { useEffect, useMemo, useState, memo } from 'react';
import { useProductsStore } from '../store/products';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ProductCardSkeleton } from '../components/ui/skeleton';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Pagination } from '../components/ui/pagination';
import { useDebounce } from '../hooks/useDebounce';

const unitOptions = ['mg', 'g', 'kg', 'ml', 'l', 'un'] as const;
const productSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	unit: z.enum(unitOptions),
	quantity: z.coerce.number().nonnegative('Quantidade não pode ser negativa').default(0),
	pricePerGram: z.coerce.number().nonnegative('Preço por grama não pode ser negativo').optional(),
});

type ProductForm = z.infer<typeof productSchema>;

type Converted = { grams: number; best: string };

function toGrams(quantity: number, unit: ProductForm['unit']): number {
	switch (unit) {
		case 'kg': return quantity * 1000;
		case 'g': return quantity;
		case 'mg': return quantity / 1000;
		default: return quantity;
	}
}

function formatBestUnit(grams: number): Converted {
	const kg = grams / 1000;
	if (kg >= 1) return { grams, best: `${kg.toFixed(1)} kg` };
	if (grams >= 1) return { grams, best: `${grams.toFixed(1)} g` };
	const mg = grams * 1000;
	return { grams, best: `${mg.toFixed(1)} mg` };
}

function ProductsPage() {
	const { items, pagination, list, create, update, remove, loading, error } = useProductsStore();
	const resolver = zodResolver(productSchema) as Resolver<ProductForm>;
	const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
		resolver,
		defaultValues: { name: '', unit: 'g', quantity: 0 },
	});
	const [search, setSearch] = useState('');
	const [open, setOpen] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageLimit, setPageLimit] = useState(10);
	
	// Debounce search para melhor performance
	const debouncedSearch = useDebounce(search, 300);

	useEffect(() => {
		list(currentPage, pageLimit).catch(() => toast.error('Falha ao carregar produtos'));
	}, [list, currentPage, pageLimit]);

	// Resetar para primeira página quando buscar
	useEffect(() => {
		if (debouncedSearch) {
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	const onSubmit: SubmitHandler<ProductForm> = async (data) => {
		try {
			// Se for unidade, manter a quantidade como está (1 em 1)
			// Caso contrário, converter para gramas
			const quantity = data.unit === 'un' ? data.quantity : toGrams(data.quantity, data.unit);
			await create({ 
				name: data.name, 
				quantity,
				unit: data.unit,
				pricePerGram: data.pricePerGram
			});
			toast.success('Produto adicionado com sucesso');
			reset({ name: '', unit: 'g', quantity: 0 });
			setOpen(false);
		} catch {
			toast.error('Erro ao adicionar produto');
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await remove(id);
			toast.success('Produto removido com sucesso');
			setDeleteConfirm(null);
		} catch {
			toast.error('Erro ao remover produto');
		}
	};

	const onError = () => {
		const first = errors.name?.message || errors.unit?.message || errors.quantity?.message || 'Verifique os campos';
		toast.error(String(first));
	};

	useEffect(() => {
		if (error) toast.error(error);
	}, [error]);

	const filtered = useMemo(() => {
		if (!Array.isArray(items)) return [];
		const term = debouncedSearch.trim().toLowerCase();
		if (!term) return items;
		return items.filter((p) => p.name.toLowerCase().includes(term));
	}, [items, debouncedSearch]);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Produtos</h1>
					<p className="text-gray-600">Gerencie seu estoque de ingredientes</p>
				</div>
				<Button 
					variant="secondary" 
					onClick={() => setOpen(true)}
					className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
				>
					+ Novo Produto
				</Button>
			</div>

			{/* Busca */}
			<div className="card p-4">
				<div className="flex items-center gap-3">
					<div className="flex-1">
						<Input 
							value={search} 
							onChange={(e) => setSearch(e.target.value)} 
							placeholder="Buscar produtos por nome..." 
							className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
						/>
					</div>
					{search && (
						<Button 
							variant="ghost" 
							onClick={() => setSearch('')}
							className="px-4 py-3 text-gray-600 hover:text-gray-800"
						>
							Limpar
						</Button>
					)}
				</div>
			</div>

			{loading && (
				<div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<ProductCardSkeleton key={i} />
					))}
				</div>
			)}

			{/* Modal de Criação */}
			<Modal open={open} onClose={() => setOpen(false)} title="Cadastrar Novo Produto">
				<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
						<Input 
							{...register('name')} 
							placeholder="Ex.: Farinha de Trigo" 
							className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
						/>
						{errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
					</div>
					
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
							<Input 
								type="number" 
								step="any" 
								{...register('quantity')} 
								className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
							/>
							{errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
							<Select 
								{...register('unit')}
								className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
							>
								{unitOptions.map((u) => (<option key={u} value={u}>{u}</option>))}
							</Select>
							{errors.unit && <p className="text-red-600 text-sm mt-1">{errors.unit.message as string}</p>}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Preço por Grama (R$)</label>
						<Input 
							type="number" 
							step="0.001" 
							{...register('pricePerGram')} 
							placeholder="Ex.: 0.025" 
							className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
						/>
						<p className="text-sm text-gray-500 mt-1">Preço por grama para cálculos de receita (opcional)</p>
						{errors.pricePerGram && <p className="text-red-600 text-sm mt-1">{errors.pricePerGram.message}</p>}
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
						<Button 
							type="button" 
							variant="ghost" 
							onClick={() => setOpen(false)}
							className="px-6 py-2 text-gray-600 hover:text-gray-800"
						>
							Cancelar
						</Button>
						<Button 
							type="submit"
							className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
						>
							Salvar Produto
						</Button>
					</div>
				</form>
			</Modal>

			{/* Lista de Produtos */}
			{!loading && (
				<div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
					{filtered.map((p: { id: string; name: string; quantity: number; unit?: string; pricePerGram?: number }) => {
						const isUnit = p.unit === 'un';
						const conv = isUnit ? { grams: p.quantity, best: `${p.quantity.toFixed(0)} un` } : formatBestUnit(p.quantity);
						const isLowStock = isUnit ? p.quantity < 1 : p.quantity < 100;
						
						return (
							<div key={p.id} className="card card-hover p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-3">
										<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg ${
											isLowStock 
												? 'bg-gradient-to-r from-red-500 to-rose-600' 
												: 'bg-gradient-to-r from-emerald-500 to-green-600'
										}`}>
											📦
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
											<p className="text-sm text-gray-600">Estoque atual</p>
										</div>
									</div>
									<div className={`px-3 py-1 rounded-full text-xs font-medium ${
										isLowStock 
											? 'bg-red-100 text-red-700' 
											: 'bg-green-100 text-green-700'
									}`}>
										{conv.best}
									</div>
								</div>
								
								<div className="space-y-3">
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600">Estoque base:</span>
										<span className="font-medium text-gray-900">{isUnit ? `${p.quantity.toFixed(0)} un` : `${conv.grams.toFixed(0)}g`}</span>
									</div>
									{p.pricePerGram && (
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600">Preço/grama:</span>
											<span className="font-medium text-green-600">R$ {p.pricePerGram.toFixed(3)}</span>
										</div>
									)}
									
									<div className="flex gap-2">
										<Button 
											variant="ghost" 
											size="sm"
											onClick={async () => { 
												try { 
													const increment = isUnit ? 1 : 100;
													await update(p.id, { quantity: p.quantity + increment }); 
													toast.success(`Estoque atualizado (+${increment}${isUnit ? ' un' : 'g'})`);
												} catch { 
													toast.error('Erro ao atualizar estoque'); 
												} 
											}}
											className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium"
										>
											{isUnit ? '+1 un' : '+100g'}
										</Button>
										<Button 
											variant="ghost" 
											size="sm"
											onClick={async () => { 
												try { 
													const decrement = isUnit ? 1 : 100;
													await update(p.id, { quantity: Math.max(0, p.quantity - decrement) }); 
													toast.success(`Estoque atualizado (-${decrement}${isUnit ? ' un' : 'g'})`);
												} catch { 
													toast.error('Erro ao atualizar estoque'); 
												} 
											}}
											className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium"
										>
											{isUnit ? '-1 un' : '-100g'}
										</Button>
									</div>
									
									<Button 
										variant="ghost" 
										size="sm"
										onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}
										className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium"
									>
										Remover Produto
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{!loading && filtered.length === 0 && (
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span className="text-2xl">📦</span>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
					</h3>
					<p className="text-gray-600 mb-4">
						{search ? 'Tente ajustar sua busca' : 'Comece adicionando seus primeiros ingredientes'}
					</p>
					{search ? (
						<Button 
							variant="ghost" 
							onClick={() => setSearch('')}
							className="px-6 py-3 text-gray-600 hover:text-gray-800"
						>
							Limpar busca
						</Button>
					) : (
						<Button 
							onClick={() => setOpen(true)}
							className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
						>
							Adicionar Primeiro Produto
						</Button>
					)}
				</div>
			)}

			{/* Paginação */}
			{pagination && !search && (
				<Pagination
					pagination={pagination}
					onPageChange={(page) => {
						setCurrentPage(page);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					onLimitChange={(limit) => {
						setPageLimit(limit);
						setCurrentPage(1);
					}}
				/>
			)}

			<ConfirmDialog
				open={!!deleteConfirm}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
				title="Confirmar Exclusão"
				message={`Tem certeza que deseja remover o produto "${deleteConfirm?.name}"?`}
				confirmText="Remover"
				cancelText="Cancelar"
				variant="danger"
			/>
		</div>
	);
}

export default memo(ProductsPage); 