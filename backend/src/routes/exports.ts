import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { CustomError } from '../middleware/errorHandler.js';

export const router = Router();

router.get('/products/csv', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const products = await prisma.product.findMany({
			where: { deletedAt: null },
			orderBy: { name: 'asc' }
		});

		const csvHeader = 'Nome,Quantidade,Unidade,Preço por Grama,Nível Mínimo\n';
		const csvRows = products.map(p => 
			`"${p.name}",${p.quantity},${p.unit},${p.pricePerGram || 0},${p.minLevel || 0}`
		).join('\n');

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename=produtos.csv');
		res.send(csvHeader + csvRows);
	} catch (error) {
		next(error);
	}
});

router.get('/recipes/csv', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const recipes = await prisma.recipe.findMany({
			where: { deletedAt: null },
			include: {
				ingredients: {
					include: { product: true }
				}
			},
			orderBy: { name: 'asc' }
		});

		const csvRows = recipes.map(recipe => {
			const ingredients = recipe.ingredients.map(ing => 
				`${ing.product.name} (${ing.amount}${ing.product.unit})`
			).join('; ');
			return `"${recipe.name}",${recipe.totalCost || 0},${recipe.servingSize || 1},"${ingredients}"`;
		});

		const csvHeader = 'Nome,Custo Total,Porções,Ingredientes\n';
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename=receitas.csv');
		res.send(csvHeader + csvRows.join('\n'));
	} catch (error) {
		next(error);
	}
});

router.get('/purchases/csv', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const purchases = await prisma.purchase.findMany({
			include: {
				supplier: true,
				items: {
					include: { product: true }
				}
			},
			orderBy: { purchaseDate: 'desc' },
			take: 100
		});

		const csvRows = purchases.map(purchase => {
			const items = purchase.items.map(item => 
				`${item.product.name} (${item.quantity}${item.product.unit})`
			).join('; ');
			return `"${purchase.purchaseDate.toISOString().split('T')[0]}","${purchase.supplier?.name || 'N/A'}",${purchase.totalAmount},"${items}","${purchase.invoiceNumber || ''}"`;
		});

		const csvHeader = 'Data,Fornecedor,Valor Total,Itens,Nota Fiscal\n';
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename=compras.csv');
		res.send(csvHeader + csvRows.join('\n'));
	} catch (error) {
		next(error);
	}
});

router.get('/stock-report/pdf', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const products = await prisma.product.findMany({
			where: { deletedAt: null },
			orderBy: { name: 'asc' }
		});

		const lowStock = products.filter(p => {
			const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
			return p.quantity < minLevel;
		});

		// Gerar HTML simples (em produção, usar biblioteca como puppeteer ou pdfkit)
		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Relatório de Estoque</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 20px; }
		h1 { color: #333; }
		table { width: 100%; border-collapse: collapse; margin-top: 20px; }
		th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
		th { background-color: #f2f2f2; }
		.low-stock { background-color: #ffebee; }
		.warning { background-color: #fff3e0; }
	</style>
</head>
<body>
	<h1>Relatório de Estoque</h1>
	<p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
	<h2>Produtos com Estoque Baixo (${lowStock.length})</h2>
	<table>
		<tr>
			<th>Produto</th>
			<th>Quantidade Atual</th>
			<th>Nível Mínimo</th>
			<th>Unidade</th>
			<th>Status</th>
		</tr>
		${lowStock.map(p => {
			const minLevel = p.minLevel ?? (p.unit === 'un' ? 1 : 100);
			const percentage = (p.quantity / minLevel) * 100;
			const status = percentage < 30 ? 'Crítico' : percentage < 60 ? 'Atenção' : 'Baixo';
			return `<tr class="${percentage < 30 ? 'low-stock' : 'warning'}">
				<td>${p.name}</td>
				<td>${p.quantity}</td>
				<td>${minLevel}</td>
				<td>${p.unit}</td>
				<td>${status}</td>
			</tr>`;
		}).join('')}
	</table>
	<h2>Todos os Produtos (${products.length})</h2>
	<table>
		<tr>
			<th>Produto</th>
			<th>Quantidade</th>
			<th>Unidade</th>
			<th>Preço/Grama</th>
		</tr>
		${products.map(p => `<tr>
			<td>${p.name}</td>
			<td>${p.quantity}</td>
			<td>${p.unit}</td>
			<td>R$ ${(p.pricePerGram || 0).toFixed(3)}</td>
		</tr>`).join('')}
	</table>
</body>
</html>`;

		res.setHeader('Content-Type', 'text/html');
		res.send(html);
	} catch (error) {
		next(error);
	}
});

