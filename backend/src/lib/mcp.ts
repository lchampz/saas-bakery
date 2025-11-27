/**
 * Model Context Protocol (MCP) Client
 * Integração para criação de receitas via IA
 */

interface MCPMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

interface MCPRequest {
	model?: string;
	messages: MCPMessage[];
	temperature?: number;
	max_tokens?: number;
}

interface MCPResponse {
	choices: Array<{
		message: {
			role: string;
			content: string;
		};
	}>;
}

export class MCPClient {
	private apiKey: string;
	private baseUrl: string;
	private model: string;
	private provider: 'ollama' | 'openai' | 'anthropic';

	constructor() {
		// Detectar provedor baseado nas variáveis de ambiente
		const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
		const useOllama = process.env.USE_OLLAMA === 'true' || process.env.OLLAMA_BASE_URL;
		
		if (useOllama) {
			this.provider = 'ollama';
			this.baseUrl = ollamaUrl;
			// Usar o modelo completo (com :latest se não especificado)
			const modelEnv = process.env.OLLAMA_MODEL || 'llama3.2';
			this.model = modelEnv.includes(':') ? modelEnv : `${modelEnv}:latest`;
			this.apiKey = ''; // Ollama não requer API key
		} else {
			this.provider = 'openai';
			this.apiKey = process.env.OPENAI_API_KEY || process.env.MCP_API_KEY || '';
			this.baseUrl = process.env.MCP_BASE_URL || 'https://api.openai.com/v1';
			this.model = process.env.MCP_MODEL || 'gpt-3.5-turbo';
		}
	}

	async generateRecipe(context: {
		description: string;
		availableProducts: Array<{ name: string; unit: string; pricePerGram?: number }>;
		servingSize: number;
		dietaryRestrictions: string[];
	}): Promise<{
		name: string;
		ingredients: Array<{ productName: string; amount: number; unit: string }>;
		instructions: string;
		estimatedCost: number;
	}> {
		// Se for Ollama e não houver baseUrl configurada, usar fallback
		if (this.provider === 'ollama' && !this.baseUrl) {
			return this.generateRecipeFallback(context);
		}

		// Se for OpenAI/Anthropic e não houver API key, usar fallback
		if (this.provider !== 'ollama' && !this.apiKey) {
			return this.generateRecipeFallback(context);
		}

		try {
			const prompt = this.buildRecipePrompt(context);
			
			if (this.provider === 'ollama') {
				return await this.callOllama(prompt, context);
			} else {
				return await this.callOpenAI(prompt, context);
			}
		} catch (error) {
			console.error('Erro ao chamar MCP:', error);
			// Fallback para geração sem IA
			return this.generateRecipeFallback(context);
		}
	}

	private async callOllama(
		prompt: string,
		context: { availableProducts: Array<{ name: string; unit: string; pricePerGram?: number }> }
	): Promise<{
		name: string;
		ingredients: Array<{ productName: string; amount: number; unit: string }>;
		instructions: string;
		estimatedCost: number;
	}> {
		const systemPrompt = 'Você é um chef de confeitaria especializado em criar receitas. IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional antes ou depois. O JSON deve seguir exatamente a estrutura solicitada.';
		
		const requestBody = {
			model: this.model,
			messages: [
				{
					role: 'system',
					content: systemPrompt
				},
				{
					role: 'user',
					content: prompt
				}
			],
			stream: false,
			options: {
				temperature: 0.7,
				top_p: 0.9
			}
		};

		console.log(`[MCP] Chamando Ollama: ${this.baseUrl}/api/chat com modelo ${this.model}`);
		
		// Timeout de 2 minutos para geração de receitas (Ollama pode demorar)
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos
		
		try {
			const response = await fetch(`${this.baseUrl}/api/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal
			});
			
			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[MCP] Ollama API error: ${response.status} ${response.statusText}`, errorText);
				throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			const content = data.message?.content;

			if (!content) {
				console.error('[MCP] Resposta vazia da API Ollama', data);
				throw new Error('Resposta vazia da API Ollama');
			}

			console.log('[MCP] Resposta recebida do Ollama:', content.substring(0, 200));

			// Ollama pode retornar JSON como string ou objeto
			let recipe;
			try {
				// Tentar parse direto
				recipe = typeof content === 'string' ? JSON.parse(content) : content;
			} catch (parseError) {
				console.warn('[MCP] Erro ao fazer parse direto, tentando extrair JSON...', parseError);
				
				// Tentar extrair JSON da resposta se não for JSON puro
				// Remover markdown code blocks se existirem
				let cleanedContent = content.trim();
				if (cleanedContent.startsWith('```json')) {
					cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
				} else if (cleanedContent.startsWith('```')) {
					cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
				}
				
				// Procurar por JSON na resposta
				const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					try {
						recipe = JSON.parse(jsonMatch[0]);
					} catch (e) {
						console.error('[MCP] Erro ao fazer parse do JSON extraído:', e);
						throw new Error(`Resposta não contém JSON válido. Conteúdo recebido: ${content.substring(0, 500)}`);
					}
				} else {
					console.error('[MCP] Nenhum JSON encontrado na resposta:', content);
					throw new Error(`Resposta não contém JSON válido. Conteúdo recebido: ${content.substring(0, 500)}`);
				}
			}

			console.log('[MCP] Receita parseada:', JSON.stringify(recipe, null, 2));

			return this.parseRecipeResponse(recipe, context);
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Timeout ao gerar receita. O Ollama demorou mais de 2 minutos para responder.');
			}
			throw error;
		}
	}

	private async callOpenAI(
		prompt: string,
		context: { availableProducts: Array<{ name: string; unit: string; pricePerGram?: number }> }
	): Promise<{
		name: string;
		ingredients: Array<{ productName: string; amount: number; unit: string }>;
		instructions: string;
		estimatedCost: number;
	}> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{
						role: 'system',
						content: 'Você é um chef de confeitaria especializado em criar receitas. Sempre retorne receitas em formato JSON válido.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 1500,
				response_format: { type: 'json_object' }
			})
		});

		if (!response.ok) {
			throw new Error(`MCP API error: ${response.statusText}`);
		}

		const data: MCPResponse = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error('Resposta vazia da API');
		}

		const recipe = JSON.parse(content);
		return this.parseRecipeResponse(recipe, context);
	}

	private buildRecipePrompt(context: {
		description: string;
		availableProducts: Array<{ name: string; unit: string }>;
		servingSize: number;
		dietaryRestrictions: string[];
	}): string {
		const productsList = context.availableProducts
			.map(p => `- ${p.name} (${p.unit})`)
			.join('\n');

		return `Crie uma receita de confeitaria com as seguintes especificações:

Descrição: ${context.description}
Porções: ${context.servingSize}
Restrições alimentares: ${context.dietaryRestrictions.length > 0 ? context.dietaryRestrictions.join(', ') : 'Nenhuma'}

Produtos disponíveis:
${productsList}

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicações. Use apenas produtos da lista disponível. As quantidades devem ser realistas para ${context.servingSize} porção(ões).

Estrutura JSON obrigatória (retorne exatamente assim):
{
	"name": "Nome da Receita",
	"ingredients": [
		{"productName": "Nome do Produto", "amount": quantidade_numerica, "unit": "unidade"}
	],
	"instructions": "Instruções passo a passo detalhadas",
	"estimatedCost": custo_numerico
}`;
	}

	private parseRecipeResponse(
		recipe: any,
		context: { availableProducts: Array<{ name: string; unit: string; pricePerGram?: number }> }
	): {
		name: string;
		ingredients: Array<{ productName: string; amount: number; unit: string }>;
		instructions: string;
		estimatedCost: number;
	} {
		// Validar e normalizar resposta
		const name = recipe.name || 'Receita Gerada';
		const ingredients = (recipe.ingredients || []).map((ing: any) => ({
			productName: ing.productName || ing.name || '',
			amount: parseFloat(ing.amount) || 0,
			unit: ing.unit || 'g'
		}));

		// Calcular custo estimado
		let estimatedCost = recipe.estimatedCost || 0;
		if (estimatedCost === 0) {
			for (const ing of ingredients) {
				const product = context.availableProducts.find(p => 
					p.name.toLowerCase() === ing.productName.toLowerCase()
				);
				if (product?.pricePerGram) {
					// Converter para gramas se necessário
					let amountInGrams = ing.amount;
					if (ing.unit === 'kg') amountInGrams = ing.amount * 1000;
					if (ing.unit === 'mg') amountInGrams = ing.amount / 1000;
					
					estimatedCost += amountInGrams * product.pricePerGram;
				}
			}
		}

		return {
			name,
			ingredients,
			instructions: recipe.instructions || 'Siga as instruções padrão para este tipo de receita.',
			estimatedCost: Math.round(estimatedCost * 100) / 100
		};
	}

	private generateRecipeFallback(context: {
		description: string;
		availableProducts: Array<{ name: string; unit: string; pricePerGram?: number }>;
		servingSize: number;
	}): {
		name: string;
		ingredients: Array<{ productName: string; amount: number; unit: string }>;
		instructions: string;
		estimatedCost: number;
	} {
		// Geração simples sem IA
		const name = context.description.split(' ').slice(0, 3).join(' ') || 'Receita Gerada';
		
		const selectedProducts = context.availableProducts.slice(0, 5);
		const ingredients = selectedProducts.map(product => {
			let amount = 0;
			if (product.unit === 'un') {
				amount = Math.max(1, Math.floor(Math.random() * 5) + 1);
			} else if (product.unit === 'kg') {
				amount = Math.round((Math.random() * 0.5 + 0.1) * 100) / 100;
			} else {
				amount = Math.round((Math.random() * 500 + 50) * 100) / 100;
			}
			return {
				productName: product.name,
				amount,
				unit: product.unit
			};
		});

		let estimatedCost = 0;
		for (const ing of ingredients) {
			const product = context.availableProducts.find(p => p.name === ing.productName);
			if (product?.pricePerGram) {
				let amountInGrams = ing.amount;
				if (ing.unit === 'kg') amountInGrams = ing.amount * 1000;
				if (ing.unit === 'mg') amountInGrams = ing.amount / 1000;
				estimatedCost += amountInGrams * product.pricePerGram;
			}
		}

		const instructions = `
1. Prepare todos os ingredientes listados
2. Misture os ingredientes secos primeiro
3. Adicione os ingredientes líquidos gradualmente
4. Misture até obter consistência homogênea
5. Siga as instruções específicas para: ${context.description}
6. Ajuste as quantidades conforme necessário para ${context.servingSize} porção(ões)
`.trim();

		return {
			name,
			ingredients,
			instructions,
			estimatedCost: Math.round(estimatedCost * 100) / 100
		};
	}
}

export const mcpClient = new MCPClient();

