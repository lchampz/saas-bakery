import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
// import { Alert } from './alert';
import { LoadingSpinner } from './loading-spinner';
import { useProductsStore } from '../../store/products';
import { useRecipesStore } from '../../store/recipes';
import { toast } from 'sonner';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  DollarSign,
  Package,
  TrendingUp,
  Save,
  Copy
} from 'lucide-react';

interface RecipeCalculatorProps {
  className?: string;
}

interface IngredientCost {
  productId: string;
  name: string;
  amount: number;
  unitPrice: number;
  totalCost: number;
}

interface RecipeCalculation {
  ingredients: IngredientCost[];
  totalCost: number;
  sellingPrice: number;
  profitMargin: number;
  profitAmount: number;
  portions: number;
  costPerPortion: number;
}

export function RecipeCalculator({ className = '' }: RecipeCalculatorProps) {
  const { items: products, list: fetchProducts } = useProductsStore();
  const { items: recipes, list: fetchRecipes } = useRecipesStore();
  
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [portions, setPortions] = useState<number>(1);
  const [profitMargin, setProfitMargin] = useState<number>(60);
  const [customIngredients, setCustomIngredients] = useState<IngredientCost[]>([]);
  const [calculation, setCalculation] = useState<RecipeCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRecipes();
  }, [fetchProducts, fetchRecipes]);

  // Recalcular automaticamente quando os produtos mudarem
  useEffect(() => {
    if (calculation && products.length > 0) {
      calculateRecipe();
    }
  }, [products]);

  const calculateRecipe = () => {
    if (!selectedRecipe && customIngredients.length === 0) {
      toast.error('Selecione uma receita ou adicione ingredientes');
      return;
    }

    if (products.length === 0) {
      toast.error('Nenhum produto disponível. Adicione produtos primeiro.');
      return;
    }

    setLoading(true);
    
    try {
      let ingredients: IngredientCost[] = [];

      if (selectedRecipe) {
        // Usar ingredientes da receita selecionada
        const recipe = recipes && recipes.length > 0 ? recipes.find((r: { id: string }) => r.id === selectedRecipe) : null;
        if (recipe && recipe.ingredients) {
          ingredients = recipe.ingredients.map((ing: { productId: string; amount: number; product?: any }) => {
            // Usar product do ingrediente (vindo do backend) ou buscar na lista como fallback
            const product = ing.product || (products && products.length > 0 ? products?.find((p) => p.id === ing.productId) : null);
            const unitPrice = product?.pricePerGram || 0; // Usar preço real por grama
            
            // Avisar se o produto não tem preço definido
            if (product && !product.pricePerGram) {
              console.warn(`Produto "${product.name}" não possui preço por grama definido`);
            }
            
            return {
              productId: ing.productId,
              name: product?.name || 'Produto não encontrado',
              amount: ing.amount * portions,
              unitPrice,
              totalCost: ing.amount * portions * unitPrice
            };
          });
        }
      } else {
        // Usar ingredientes customizados
        ingredients = customIngredients.map(ing => ({
          ...ing,
          amount: ing.amount * portions,
          totalCost: ing.amount * portions * ing.unitPrice
        }));
      }

      const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
      const costPerPortion = totalCost / portions;
      const sellingPrice = costPerPortion * (1 + profitMargin / 100);
      const profitAmount = sellingPrice - costPerPortion;

      setCalculation({
        ingredients,
        totalCost,
        sellingPrice,
        profitMargin,
        profitAmount,
        portions,
        costPerPortion
      });

      toast.success('Cálculo realizado com sucesso!');
    } catch {
      toast.error('Erro ao calcular receita');
    } finally {
      setLoading(false);
    }
  };

  const addCustomIngredient = () => {
    setCustomIngredients([...customIngredients, {
      productId: '',
      name: '',
      amount: 0,
      unitPrice: 0,
      totalCost: 0
    }]);
  };

  const removeCustomIngredient = (index: number) => {
    setCustomIngredients(customIngredients.filter((_, i) => i !== index));
  };

  const updateCustomIngredient = (index: number, field: keyof IngredientCost, value: string | number) => {
    const updated = [...customIngredients];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'amount' || field === 'unitPrice') {
      updated[index].totalCost = updated[index].amount * updated[index].unitPrice;
    }
    
    setCustomIngredients(updated);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const copyCalculation = () => {
    if (calculation) {
      const text = `
Receita: ${selectedRecipe && recipes && recipes.length > 0 ? recipes.find((r: { id: string; name: string }) => r.id === selectedRecipe)?.name : 'Receita Customizada'}
Porções: ${calculation.portions}
Custo Total: ${formatCurrency(calculation.totalCost)}
Preço de Venda: ${formatCurrency(calculation.sellingPrice)}
Margem de Lucro: ${calculation.profitMargin}%
Lucro: ${formatCurrency(calculation.profitAmount)}
      `.trim();
      
      navigator.clipboard.writeText(text);
      toast.success('Cálculo copiado para a área de transferência!');
    }
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Calculadora de Receitas
          </h3>
          <p className="text-sm text-gray-600">
            Calcule custos, preços e margens de lucro das suas receitas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Receita Base (opcional)
            </label>
            <Select
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="w-full"
            >
              <option value="">Receita Customizada</option>
              {recipes.map((recipe: { id: string; name: string }) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Porções
              </label>
              <Input
                type="number"
                value={portions}
                onChange={(e) => setPortions(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margem de Lucro (%)
              </label>
              <Input
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                min="0"
                max="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Ingredientes customizados */}
          {!selectedRecipe && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Ingredientes Customizados
                </label>
                <Button onClick={addCustomIngredient} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-auto">
                {customIngredients.map((ingredient, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        placeholder="Nome do ingrediente"
                        value={ingredient.name}
                        onChange={(e) => updateCustomIngredient(index, 'name', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Quantidade"
                        value={ingredient.amount}
                        onChange={(e) => updateCustomIngredient(index, 'amount', Number(e.target.value))}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Preço por grama (R$)"
                        value={ingredient.unitPrice}
                        onChange={(e) => updateCustomIngredient(index, 'unitPrice', Number(e.target.value))}
                        min="0"
                        step="0.001"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(ingredient.totalCost)}
                        </span>
                        <Button
                          onClick={() => removeCustomIngredient(index)}
                          size="sm"
                          variant="outline"
                          className="p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={calculateRecipe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Receita
              </>
            )}
          </Button>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {calculation ? (
            <>
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  Resumo Financeiro
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(calculation.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custo por Porção:</span>
                    <span className="font-medium">{formatCurrency(calculation.costPerPortion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Preço de Venda:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculation.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Margem de Lucro:</span>
                    <span className="font-medium text-blue-600">{calculation.profitMargin}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Lucro por Porção:</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculation.profitAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Package className="w-4 h-4" />
                  </div>
                  Detalhamento de Ingredientes
                </h4>
                <div className="space-y-3 max-h-48 overflow-auto">
                  {calculation.ingredients.map((ingredient, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(ingredient.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          {ingredient.amount}g × {ingredient.unitPrice > 0 ? `${formatCurrency(ingredient.unitPrice)}/g` : 'Preço não definido'}
                        </span>
                        <span className={ingredient.unitPrice > 0 ? '' : 'text-red-500'}>
                          = {ingredient.unitPrice > 0 ? formatCurrency(ingredient.amount * ingredient.unitPrice) : 'R$ 0,00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={copyCalculation} 
                  variant="outline" 
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Cálculo
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Receita
                </Button>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Configure e calcule
              </h4>
              <p className="text-gray-600">
                Selecione uma receita ou adicione ingredientes customizados para ver os cálculos aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dicas */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Dicas para Precificação
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Margem de 50-70% é comum para confeitaria</li>
          <li>• Considere custos indiretos (energia, água, embalagem)</li>
          <li>• Pesquise preços da concorrência</li>
          <li>• Ajuste preços conforme sazonalidade</li>
        </ul>
      </div>
    </div>
  );
}
