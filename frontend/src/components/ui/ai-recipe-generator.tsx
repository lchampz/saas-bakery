import React, { useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { LoadingSpinner } from './loading-spinner';
import { useRecipesStore } from '../../store/recipes';
import { useProductsStore } from '../../store/products';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface AIRecipeGeneratorProps {
	open: boolean;
	onClose: () => void;
	onRecipeGenerated: (recipe: {
		name: string;
		ingredients: Array<{ productId: string; amount: number }>;
		instructions?: string;
		servingSize?: number;
	}) => void;
}

export function AIRecipeGenerator({ open, onClose, onRecipeGenerated }: AIRecipeGeneratorProps) {
	const { generateWithAI, loading } = useRecipesStore();
	const { items: products } = useProductsStore();
	const [description, setDescription] = useState('');
	const [servingSize, setServingSize] = useState(8);
	const [dietaryRestrictions, setDietaryRestrictions] = useState('');
	const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerate = async () => {
		if (!description.trim()) {
			toast.error('Por favor, descreva a receita que deseja criar');
			return;
		}

		setIsGenerating(true);
		try {
			const restrictions = dietaryRestrictions
				.split(',')
				.map(r => r.trim())
				.filter(r => r.length > 0);

			const recipe = await generateWithAI({
				description: description.trim(),
				servingSize,
				dietaryRestrictions: restrictions
			});

			setGeneratedRecipe(recipe);
			toast.success('Receita gerada com sucesso!');
		} catch (error) {
			toast.error('Erro ao gerar receita. Tente novamente.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleUseRecipe = () => {
		if (!generatedRecipe) return;

		// Mapear ingredientes gerados para IDs de produtos
		const ingredients = generatedRecipe.ingredients
			.map((ing: any) => {
				const product = Array.isArray(products) 
					? products.find(p => p.name.toLowerCase() === ing.productName.toLowerCase())
					: null;
				
				if (!product) return null;
				
				return {
					productId: product.id,
					amount: ing.amount
				};
			})
			.filter((ing: any): ing is { productId: string; amount: number } => ing !== null);

		if (ingredients.length === 0) {
			toast.error('Nenhum produto correspondente encontrado. Verifique os produtos cadastrados.');
			return;
		}

		onRecipeGenerated({
			name: generatedRecipe.name,
			ingredients,
			instructions: generatedRecipe.instructions,
			servingSize: generatedRecipe.servingSize
		});

		// Reset
		setDescription('');
		setServingSize(8);
		setDietaryRestrictions('');
		setGeneratedRecipe(null);
		onClose();
	};

	const handleClose = () => {
		setDescription('');
		setServingSize(8);
		setDietaryRestrictions('');
		setGeneratedRecipe(null);
		onClose();
	};

	return (
		<Modal 
			open={open} 
			onClose={handleClose} 
			title="Gerar Receita com IA"
			className="max-w-3xl"
		>
			<div className="space-y-4">
				{!generatedRecipe ? (
					<>
						<div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
							<Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
							<div>
								<p className="font-semibold text-purple-900 text-sm">Gerador de Receitas com IA</p>
								<p className="text-xs text-purple-700">Descreva a receita que deseja criar e nossa IA irá gerar uma receita completa com ingredientes e instruções.</p>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-900 mb-1.5">
								Descrição da Receita *
							</label>
							<Input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Ex.: Bolo de chocolate com cobertura de ganache e morangos"
								className="w-full text-gray-900"
								disabled={isGenerating}
							/>
							<p className="text-xs text-gray-500 mt-1">
								Seja específico sobre o tipo de receita, sabores e características desejadas
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1.5">
									Porções
								</label>
								<Input
									type="number"
									min="1"
									value={servingSize}
									onChange={(e) => setServingSize(parseInt(e.target.value) || 8)}
									className="w-full text-gray-900"
									disabled={isGenerating}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1.5">
									Restrições Alimentares (opcional)
								</label>
								<Input
									value={dietaryRestrictions}
									onChange={(e) => setDietaryRestrictions(e.target.value)}
									placeholder="Ex.: sem glúten, vegano, sem lactose"
									className="w-full text-gray-900"
									disabled={isGenerating}
								/>
								<p className="text-xs text-gray-500 mt-1">
									Separe múltiplas restrições por vírgula
								</p>
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
							<Button
								type="button"
								variant="ghost"
								onClick={handleClose}
								disabled={isGenerating}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={handleGenerate}
								disabled={isGenerating || !description.trim()}
								className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
							>
								{isGenerating ? (
									<>
										<LoadingSpinner size="sm" className="mr-2" />
										Gerando...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4 mr-2" />
										Gerar Receita
									</>
								)}
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="p-3 bg-green-50 rounded-lg border border-green-200">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xl">✨</span>
								<h3 className="font-semibold text-green-900 text-sm">Receita Gerada com Sucesso!</h3>
							</div>
							<p className="text-xs text-green-700">
								Revise os detalhes abaixo e clique em "Usar Receita" para adicioná-la ao sistema.
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-900 mb-2">Nome da Receita</label>
							<Input
								value={generatedRecipe.name}
								onChange={(e) => setGeneratedRecipe({ ...generatedRecipe, name: e.target.value })}
								className="w-full text-gray-900"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-900 mb-2">Ingredientes</label>
							<div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
								{generatedRecipe.ingredients.map((ing: any, idx: number) => {
									const product = Array.isArray(products) 
										? products.find(p => p.name.toLowerCase() === ing.productName.toLowerCase())
										: null;
									
									return (
										<div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded text-sm">
											<span className="text-gray-900 text-sm">
												{ing.productName} - {ing.amount} {ing.unit || 'g'}
											</span>
											{product ? (
												<span className="text-xs text-green-600 font-medium">✓ Encontrado</span>
											) : (
												<span className="text-xs text-amber-600 font-medium">⚠ Não encontrado</span>
											)}
										</div>
									);
								})}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-900 mb-2">Instruções</label>
							<textarea
								value={generatedRecipe.instructions}
								onChange={(e) => setGeneratedRecipe({ ...generatedRecipe, instructions: e.target.value })}
								className="w-full px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
								rows={4}
							/>
						</div>

						<div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
							<div>
								<p className="text-xs text-gray-600 mb-0.5">Custo Estimado</p>
								<p className="text-base font-semibold text-gray-900">
									R$ {generatedRecipe.estimatedCost.toFixed(2)}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-600 mb-0.5">Porções</p>
								<p className="text-base font-semibold text-gray-900">
									{generatedRecipe.servingSize}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-600 mb-0.5">Custo por Porção</p>
								<p className="text-base font-semibold text-gray-900">
									R$ {(generatedRecipe.estimatedCost / generatedRecipe.servingSize).toFixed(2)}
								</p>
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setGeneratedRecipe(null)}
								className="text-gray-700 hover:text-gray-900"
							>
								Gerar Outra
							</Button>
							<Button
								type="button"
								onClick={handleUseRecipe}
								className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
							>
								Usar Receita
							</Button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}

