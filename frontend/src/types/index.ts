export type User = { id: string; email: string };

export type Product = {
	id: string;
	name: string;
	unit: string;
	quantity: number;
	pricePerGram?: number;
	createdAt: string;
};

export type RecipeIngredient = { 
	id: string; 
	recipeId: string; 
	productId: string; 
	amount: number;
	product?: Product | null;
};

export type Recipe = {
	id: string;
	name: string;
	createdAt: string;
	ingredients: RecipeIngredient[];
};

export type Consumption = {
	id: string;
	productId: string;
	amount: number;
	reason: string;
	createdAt: string;
	product: Product;
}; 