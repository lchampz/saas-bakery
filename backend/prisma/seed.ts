import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Iniciando seed do banco de dados...\n');

	// ============================================
	// CRIAR USUÁRIOS
	// ============================================
	console.log('👥 Criando usuários...');
	const usuarios = [
		{ email: 'admin@fratelli.com', password: 'admin123', role: 'admin' },
		{ email: 'gerente@fratelli.com', password: 'gerente123', role: 'manager' },
		{ email: 'confeiteiro@fratelli.com', password: 'confeiteiro123', role: 'baker' },
		{ email: 'teste@fratelli.com', password: 'teste123', role: 'user' },
		{ email: 'maria.silva@fratelli.com', password: 'maria123', role: 'baker' },
		{ email: 'joao.santos@fratelli.com', password: 'joao123', role: 'baker' },
	];

	for (const usuario of usuarios) {
		const passwordHash = await bcrypt.hash(usuario.password, 10);
		await prisma.user.upsert({
			where: { email: usuario.email },
			update: { passwordHash },
			create: {
				email: usuario.email,
				passwordHash,
			},
		});
	}
	console.log(`✅ ${usuarios.length} usuários criados\n`);

	// ============================================
	// CRIAR PRODUTOS (PREÇOS REAIS EM R$/kg)
	// ============================================
	console.log('📦 Criando produtos com preços reais...');
	
	// Preços baseados em mercado brasileiro (R$/kg convertido para R$/g)
	const produtos = [
		// Farinhas e bases
		{ name: 'Farinha de Trigo', quantity: 50000, pricePerGram: 0.0035 }, // R$ 3,50/kg
		{ name: 'Farinha de Amêndoas', quantity: 5000, pricePerGram: 0.045 }, // R$ 45/kg
		{ name: 'Farinha de Coco', quantity: 3000, pricePerGram: 0.025 }, // R$ 25/kg
		{ name: 'Amido de Milho', quantity: 8000, pricePerGram: 0.004 }, // R$ 4/kg
		
		// Açúcares
		{ name: 'Açúcar Refinado', quantity: 30000, pricePerGram: 0.0042 }, // R$ 4,20/kg
		{ name: 'Açúcar de Confeiteiro', quantity: 10000, pricePerGram: 0.006 }, // R$ 6/kg
		{ name: 'Açúcar Mascavo', quantity: 5000, pricePerGram: 0.005 }, // R$ 5/kg
		{ name: 'Mel', quantity: 8000, pricePerGram: 0.012 }, // R$ 12/kg
		
		// Laticínios
		{ name: 'Manteiga', quantity: 15000, pricePerGram: 0.032 }, // R$ 32/kg
		{ name: 'Margarina', quantity: 12000, pricePerGram: 0.015 }, // R$ 15/kg
		{ name: 'Leite', quantity: 40000, pricePerGram: 0.003 }, // R$ 3/L (1L = 1000g)
		{ name: 'Leite Condensado', quantity: 20000, pricePerGram: 0.008 }, // R$ 8/kg
		{ name: 'Creme de Leite', quantity: 15000, pricePerGram: 0.012 }, // R$ 12/kg
		{ name: 'Queijo Cream Cheese', quantity: 8000, pricePerGram: 0.028 }, // R$ 28/kg
		
		// Ovos e proteínas
		{ name: 'Ovos', quantity: 500, pricePerGram: 0.008 }, // R$ 8/kg (1 ovo ~50g)
		
		// Chocolates e cacau
		{ name: 'Chocolate em Pó', quantity: 12000, pricePerGram: 0.018 }, // R$ 18/kg
		{ name: 'Cacau em Pó', quantity: 8000, pricePerGram: 0.025 }, // R$ 25/kg
		{ name: 'Chocolate Meio Amargo', quantity: 10000, pricePerGram: 0.035 }, // R$ 35/kg
		{ name: 'Chocolate Branco', quantity: 6000, pricePerGram: 0.030 }, // R$ 30/kg
		
		// Oleaginosas
		{ name: 'Amêndoas', quantity: 8000, pricePerGram: 0.042 }, // R$ 42/kg
		{ name: 'Avelãs', quantity: 5000, pricePerGram: 0.055 }, // R$ 55/kg
		{ name: 'Nozes', quantity: 4000, pricePerGram: 0.048 }, // R$ 48/kg
		{ name: 'Castanha do Pará', quantity: 3000, pricePerGram: 0.052 }, // R$ 52/kg
		{ name: 'Amendoim', quantity: 6000, pricePerGram: 0.012 }, // R$ 12/kg
		
		// Frutas e conservas
		{ name: 'Morango', quantity: 10000, pricePerGram: 0.015 }, // R$ 15/kg
		{ name: 'Banana', quantity: 15000, pricePerGram: 0.004 }, // R$ 4/kg
		{ name: 'Limão', quantity: 5000, pricePerGram: 0.003 }, // R$ 3/kg
		{ name: 'Coco Ralado', quantity: 8000, pricePerGram: 0.014 }, // R$ 14/kg
		
		// Fermentos e leveduras
		{ name: 'Fermento em Pó', quantity: 3000, pricePerGram: 0.025 }, // R$ 25/kg
		{ name: 'Fermento Biológico', quantity: 2000, pricePerGram: 0.020 }, // R$ 20/kg
		
		// Essências e aromas
		{ name: 'Baunilha', quantity: 1500, pricePerGram: 0.180 }, // R$ 180/kg
		{ name: 'Essência de Baunilha', quantity: 2000, pricePerGram: 0.080 }, // R$ 80/kg
		{ name: 'Canela em Pó', quantity: 2000, pricePerGram: 0.035 }, // R$ 35/kg
		{ name: 'Noz Moscada', quantity: 500, pricePerGram: 0.120 }, // R$ 120/kg
		
		// Gelatinas e estabilizantes
		{ name: 'Gelatina em Pó', quantity: 2500, pricePerGram: 0.085 }, // R$ 85/kg
		{ name: 'Ágar-Ágar', quantity: 1000, pricePerGram: 0.150 }, // R$ 150/kg
		
		// Corantes e decorações
		{ name: 'Corante Alimentício Vermelho', quantity: 500, pricePerGram: 0.200 }, // R$ 200/kg
		{ name: 'Corante Alimentício Azul', quantity: 500, pricePerGram: 0.200 },
		{ name: 'Corante Alimentício Amarelo', quantity: 500, pricePerGram: 0.200 },
		{ name: 'Corante Alimentício Verde', quantity: 500, pricePerGram: 0.200 },
		{ name: 'Confeitos Coloridos', quantity: 3000, pricePerGram: 0.045 }, // R$ 45/kg
		{ name: 'Granulado', quantity: 4000, pricePerGram: 0.025 }, // R$ 25/kg
		
		// Óleos e gorduras
		{ name: 'Óleo de Soja', quantity: 15000, pricePerGram: 0.006 }, // R$ 6/kg
		{ name: 'Óleo de Coco', quantity: 5000, pricePerGram: 0.022 }, // R$ 22/kg
		
		// Temperos básicos
		{ name: 'Sal', quantity: 5000, pricePerGram: 0.0015 }, // R$ 1,50/kg
		{ name: 'Bicarbonato de Sódio', quantity: 2000, pricePerGram: 0.008 }, // R$ 8/kg
		
		// Extras
		{ name: 'Coco Desidratado', quantity: 4000, pricePerGram: 0.018 }, // R$ 18/kg
		{ name: 'Passas', quantity: 3000, pricePerGram: 0.020 }, // R$ 20/kg
		{ name: 'Tâmara', quantity: 2000, pricePerGram: 0.025 }, // R$ 25/kg
	];

	const produtosMap = new Map<string, string>();
	
	for (const produto of produtos) {
		const existingProduct = await prisma.product.findFirst({
			where: { name: produto.name }
		});
		
		let productId: string;
		if (existingProduct) {
			const updated = await prisma.product.update({
				where: { id: existingProduct.id },
				data: { 
					quantity: produto.quantity,
					pricePerGram: produto.pricePerGram
				},
			});
			productId = updated.id;
		} else {
			const created = await prisma.product.create({
				data: produto,
			});
			productId = created.id;
		}
		produtosMap.set(produto.name, productId);
	}
	console.log(`✅ ${produtos.length} produtos criados/atualizados\n`);

	// ============================================
	// CRIAR RECEITAS (APENAS COM INGREDIENTES CADASTRADOS)
	// ============================================
	console.log('🍰 Criando receitas...');
	
	const receitas = [
		{
			name: 'Bolo de Chocolate',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Chocolate em Pó', amount: 100 },
				{ name: 'Ovos', amount: 150 }, // 3 ovos = 150g
				{ name: 'Leite', amount: 200 },
				{ name: 'Óleo de Soja', amount: 100 },
				{ name: 'Fermento em Pó', amount: 15 },
			],
		},
		{
			name: 'Cupcake de Baunilha',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 200 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Manteiga', amount: 100 },
				{ name: 'Ovos', amount: 100 }, // 2 ovos = 100g
				{ name: 'Leite', amount: 100 },
				{ name: 'Essência de Baunilha', amount: 5 },
				{ name: 'Fermento em Pó', amount: 10 },
			],
		},
		{
			name: 'Torta de Morango',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 250 },
				{ name: 'Açúcar Refinado', amount: 100 },
				{ name: 'Manteiga', amount: 150 },
				{ name: 'Ovos', amount: 100 },
				{ name: 'Creme de Leite', amount: 300 },
				{ name: 'Gelatina em Pó', amount: 20 },
				{ name: 'Morango', amount: 500 },
			],
		},
		{
			name: 'Brigadeiro Gourmet',
			ingredients: [
				{ name: 'Leite Condensado', amount: 400 },
				{ name: 'Chocolate em Pó', amount: 50 },
				{ name: 'Manteiga', amount: 20 },
				{ name: 'Avelãs', amount: 30 },
			],
		},
		{
			name: 'Brigadeiro Branco',
			ingredients: [
				{ name: 'Leite Condensado', amount: 400 },
				{ name: 'Chocolate Branco', amount: 100 },
				{ name: 'Manteiga', amount: 20 },
			],
		},
		{
			name: 'Brownie de Chocolate',
			ingredients: [
				{ name: 'Chocolate Meio Amargo', amount: 200 },
				{ name: 'Manteiga', amount: 150 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Farinha de Trigo', amount: 100 },
				{ name: 'Cacau em Pó', amount: 50 },
			],
		},
		{
			name: 'Cheesecake',
			ingredients: [
				{ name: 'Queijo Cream Cheese', amount: 500 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Creme de Leite', amount: 200 },
				{ name: 'Essência de Baunilha', amount: 10 },
				{ name: 'Farinha de Trigo', amount: 200 }, // Base da massa
			],
		},
		{
			name: 'Pão de Mel',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 400 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Mel', amount: 200 },
				{ name: 'Ovos', amount: 100 },
				{ name: 'Leite', amount: 150 },
				{ name: 'Canela em Pó', amount: 10 },
				{ name: 'Fermento em Pó', amount: 15 },
			],
		},
		{
			name: 'Torta de Limão',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 300 },
				{ name: 'Manteiga', amount: 150 },
				{ name: 'Açúcar Refinado', amount: 100 },
				{ name: 'Leite Condensado', amount: 400 },
				{ name: 'Limão', amount: 200 },
				{ name: 'Gelatina em Pó', amount: 15 },
			],
		},
		{
			name: 'Bolo de Coco com Leite',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Óleo de Soja', amount: 150 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Coco Ralado', amount: 200 },
				{ name: 'Leite', amount: 200 },
				{ name: 'Fermento em Pó', amount: 15 },
			],
		},
		{
			name: 'Cookie de Chocolate',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 250 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Manteiga', amount: 120 },
				{ name: 'Ovos', amount: 50 },
				{ name: 'Chocolate Meio Amargo', amount: 200 },
				{ name: 'Fermento em Pó', amount: 5 },
			],
		},
		{
			name: 'Torta de Nozes',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 200 },
				{ name: 'Nozes', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Manteiga', amount: 100 },
				{ name: 'Ovos', amount: 100 },
			],
		},
		{
			name: 'Pudim de Leite Condensado',
			ingredients: [
				{ name: 'Leite Condensado', amount: 400 },
				{ name: 'Leite', amount: 400 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Açúcar Refinado', amount: 100 },
			],
		},
		{
			name: 'Bolo de Amêndoas',
			ingredients: [
				{ name: 'Farinha de Amêndoas', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Manteiga', amount: 150 },
				{ name: 'Ovos', amount: 200 },
				{ name: 'Amêndoas', amount: 100 },
			],
		},
		{
			name: 'Cupcake de Chocolate',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 180 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Chocolate em Pó', amount: 50 },
				{ name: 'Manteiga', amount: 100 },
				{ name: 'Ovos', amount: 100 },
				{ name: 'Leite', amount: 120 },
				{ name: 'Fermento em Pó', amount: 10 },
			],
		},
		{
			name: 'Torta de Banana',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 250 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Banana', amount: 600 },
				{ name: 'Manteiga', amount: 100 },
				{ name: 'Ovos', amount: 100 },
				{ name: 'Canela em Pó', amount: 10 },
			],
		},
		{
			name: 'Brigadeiro de Coco',
			ingredients: [
				{ name: 'Leite Condensado', amount: 400 },
				{ name: 'Coco Ralado', amount: 150 },
				{ name: 'Manteiga', amount: 20 },
			],
		},
		{
			name: 'Bolo Red Velvet',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Manteiga', amount: 150 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Leite', amount: 200 },
				{ name: 'Corante Alimentício Vermelho', amount: 5 },
				{ name: 'Essência de Baunilha', amount: 10 },
				{ name: 'Fermento em Pó', amount: 15 },
			],
		},
		{
			name: 'Torta de Amendoim',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 200 },
				{ name: 'Amendoim', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 150 },
				{ name: 'Manteiga', amount: 120 },
				{ name: 'Ovos', amount: 100 },
			],
		},
		{
			name: 'Bolo de Coco',
			ingredients: [
				{ name: 'Farinha de Trigo', amount: 300 },
				{ name: 'Açúcar Refinado', amount: 200 },
				{ name: 'Coco Ralado', amount: 200 },
				{ name: 'Leite', amount: 200 },
				{ name: 'Ovos', amount: 150 },
				{ name: 'Óleo de Coco', amount: 100 },
				{ name: 'Fermento em Pó', amount: 15 },
			],
		},
	];

	let receitasCriadas = 0;
	for (const receita of receitas) {
		// Verificar se todos os ingredientes existem
		const ingredientesValidos = receita.ingredients.filter(ing => {
			const produtoExiste = produtosMap.has(ing.name);
			if (!produtoExiste) {
				console.log(`⚠️  Ingrediente "${ing.name}" não encontrado na receita "${receita.name}"`);
			}
			return produtoExiste;
		});

		if (ingredientesValidos.length === 0) {
			console.log(`❌ Receita "${receita.name}" ignorada - nenhum ingrediente válido`);
			continue;
		}

		const existingRecipe = await prisma.recipe.findFirst({
			where: { name: receita.name }
		});

		let recipeId: string;
		if (existingRecipe) {
			// Deletar ingredientes antigos
			await prisma.recipeIngredient.deleteMany({
				where: { recipeId: existingRecipe.id }
			});
			recipeId = existingRecipe.id;
		} else {
			const created = await prisma.recipe.create({
				data: { name: receita.name },
			});
			recipeId = created.id;
		}

		// Adicionar apenas ingredientes válidos
		for (const ingrediente of ingredientesValidos) {
			const productId = produtosMap.get(ingrediente.name)!;
			await prisma.recipeIngredient.create({
				data: {
					recipeId,
					productId,
					amount: ingrediente.amount,
				},
			});
		}
		receitasCriadas++;
	}
	console.log(`✅ ${receitasCriadas} receitas criadas/atualizadas\n`);

	// ============================================
	// CRIAR HISTÓRICO DE CONSUMO (DADOS REALISTAS)
	// ============================================
	console.log('📊 Criando histórico de consumo...');
	
	// Obter todos os produtos para consumo
	const allProducts = await prisma.product.findMany();
	
	// Criar múltiplos consumos para cada produto (últimos 90 dias)
	const consumos: Array<{
		productId: string;
		amount: number;
		reason: string;
		createdAt: Date;
	}> = [];
	const hoje = new Date();
	
	for (let dia = 0; dia < 90; dia++) {
		const dataConsumo = new Date(hoje);
		dataConsumo.setDate(dataConsumo.getDate() - dia);
		
		// Criar 3-8 consumos por dia (simulando produção diária)
		const numConsumos = Math.floor(Math.random() * 6) + 3;
		
		for (let i = 0; i < numConsumos; i++) {
			const produto = allProducts[Math.floor(Math.random() * allProducts.length)];
			const razoes = [
				'Produção de bolos',
				'Preparação de doces',
				'Fabricacao de tortas',
				'Elaboracao de cupcakes',
				'Producao de brigadeiros',
				'Fabricacao de cookies',
				'Preparacao de pudins',
				'Elaboracao de cheesecakes',
				'Producao diaria',
				'Pedido especial',
				'Encomenda personalizada',
				'Teste de receita',
				'Reposicao de estoque',
				'Preparacao para evento',
			];
			
			// Quantidade baseada no tipo de produto (em gramas)
			let quantidade = 0;
			if (produto.name.includes('Farinha') || produto.name.includes('Açúcar')) {
				quantidade = Math.floor(Math.random() * 2000) + 500; // 500-2500g
			} else if (produto.name.includes('Ovos')) {
				quantidade = Math.floor(Math.random() * 30) + 10; // 10-40 ovos (500-2000g)
			} else if (produto.name.includes('Leite') || produto.name.includes('Creme')) {
				quantidade = Math.floor(Math.random() * 3000) + 500; // 500-3500g
			} else if (produto.name.includes('Chocolate') || produto.name.includes('Cacau')) {
				quantidade = Math.floor(Math.random() * 1000) + 200; // 200-1200g
			} else if (produto.name.includes('Manteiga') || produto.name.includes('Margarina')) {
				quantidade = Math.floor(Math.random() * 2000) + 300; // 300-2300g
			} else if (produto.name.includes('Fermento')) {
				quantidade = Math.floor(Math.random() * 100) + 20; // 20-120g
			} else if (produto.name.includes('Amêndoas') || produto.name.includes('Avelãs') || produto.name.includes('Nozes')) {
				quantidade = Math.floor(Math.random() * 500) + 100; // 100-600g
			} else {
				quantidade = Math.floor(Math.random() * 1000) + 100; // 100-1100g
			}
			
			// Adicionar variação de horário no mesmo dia
			const hora = Math.floor(Math.random() * 24);
			const minuto = Math.floor(Math.random() * 60);
			const dataComHora = new Date(dataConsumo);
			dataComHora.setHours(hora, minuto, 0, 0);
			
			consumos.push({
				productId: produto.id,
				amount: quantidade,
				reason: razoes[Math.floor(Math.random() * razoes.length)],
				createdAt: dataComHora,
			});
		}
	}
	
	// Inserir em lotes para melhor performance
	const batchSize = 100;
	for (let i = 0; i < consumos.length; i += batchSize) {
		const batch = consumos.slice(i, i + batchSize);
		await prisma.consumption.createMany({
			data: batch,
		});
	}
	
	console.log(`✅ ${consumos.length} registros de consumo criados (últimos 90 dias)\n`);

	// ============================================
	// RESUMO FINAL
	// ============================================
	const totalProdutos = await prisma.product.count();
	const totalReceitas = await prisma.recipe.count();
	const totalConsumos = await prisma.consumption.count();
	const totalUsuarios = await prisma.user.count();
	
	console.log('🌱 Seed concluído com sucesso!');
	console.log('═══════════════════════════════════════');
	console.log(`👥 Usuários: ${totalUsuarios}`);
	console.log(`📦 Produtos: ${totalProdutos} (com preços reais)`);
	console.log(`🍰 Receitas: ${totalReceitas}`);
	console.log(`📊 Histórico de consumo: ${totalConsumos} registros`);
	console.log('═══════════════════════════════════════');
}

main()
	.catch((e) => {
		console.error(e);
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	}); 