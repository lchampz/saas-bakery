-- ============================================
-- SEED SQL PARA BANCO DE DADOS FRATELLI
-- ============================================
-- Este arquivo popula o banco de dados com dados iniciais
-- Execute: psql -h <host> -U <user> -d postgres -f seed.sql
-- ============================================

BEGIN;

-- ============================================
-- LIMPAR DADOS EXISTENTES (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo se quiser limpar os dados antes de inserir
-- DELETE FROM "Consumption";
-- DELETE FROM "RecipeIngredient";
-- DELETE FROM "Recipe";
-- DELETE FROM "Product";
-- DELETE FROM "User";

-- ============================================
-- CRIAR USUÁRIOS
-- ============================================
INSERT INTO "User" (id, email, "passwordHash", "createdAt", "updatedAt")
VALUES
    ('clx0000000000000000000000001', 'admin@fratelli.com', '$2a$10$L5j3kHKbKPETHlgtVrVN8.XHhjZUdPwUAltu3GBsLsAWu.TbzTTGW', NOW(), NOW()),
    ('clx0000000000000000000000002', 'gerente@fratelli.com', '$2a$10$ZuMi5M.BZYRBBFXqMzj.ZOK0Jtl96CXyijuzBQHwz0z3JJcChaTCm', NOW(), NOW()),
    ('clx0000000000000000000000003', 'confeiteiro@fratelli.com', '$2a$10$UufUj7Z56INvV.u43vBzw.CV/Q56TdZIkEZ389c3zeDI2AkVuTbPG', NOW(), NOW()),
    ('clx0000000000000000000000004', 'teste@fratelli.com', '$2a$10$s161xfGfv6URd9csqzE0seuobx.Xn7zLClo/LIckD26tgIHW49EPO', NOW(), NOW()),
    ('clx0000000000000000000000005', 'maria.silva@fratelli.com', '$2a$10$/pvmGSvtmhnSOsA/89z19Omm4.k47fzlubusdBFfdoqIz5AorcdR6', NOW(), NOW()),
    ('clx0000000000000000000000006', 'joao.santos@fratelli.com', '$2a$10$MmFLvOo8EQINDLsq2ttVh.0lLXYGzOTuNtCgV1nuGPQoGZ7dXCtlG', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    "passwordHash" = EXCLUDED."passwordHash",
    "updatedAt" = NOW();

-- ============================================
-- CRIAR PRODUTOS (PREÇOS REAIS EM R$/kg)
-- ============================================
INSERT INTO "Product" (id, name, quantity, "pricePerGram", "createdAt", "updatedAt", "deletedAt")
VALUES
    -- Farinhas e bases
    ('clp0000000000000000000000001', 'Farinha de Trigo', 50000, 0.0035, NOW(), NOW(), NULL),
    ('clp0000000000000000000000002', 'Farinha de Amêndoas', 5000, 0.045, NOW(), NOW(), NULL),
    ('clp0000000000000000000000003', 'Farinha de Coco', 3000, 0.025, NOW(), NOW(), NULL),
    ('clp0000000000000000000000004', 'Amido de Milho', 8000, 0.004, NOW(), NOW(), NULL),
    
    -- Açúcares
    ('clp0000000000000000000000005', 'Açúcar Refinado', 30000, 0.0042, NOW(), NOW(), NULL),
    ('clp0000000000000000000000006', 'Açúcar de Confeiteiro', 10000, 0.006, NOW(), NOW(), NULL),
    ('clp0000000000000000000000007', 'Açúcar Mascavo', 5000, 0.005, NOW(), NOW(), NULL),
    ('clp0000000000000000000000008', 'Mel', 8000, 0.012, NOW(), NOW(), NULL),
    
    -- Laticínios
    ('clp0000000000000000000000009', 'Manteiga', 15000, 0.032, NOW(), NOW(), NULL),
    ('clp0000000000000000000000010', 'Margarina', 12000, 0.015, NOW(), NOW(), NULL),
    ('clp0000000000000000000000011', 'Leite', 40000, 0.003, NOW(), NOW(), NULL),
    ('clp0000000000000000000000012', 'Leite Condensado', 20000, 0.008, NOW(), NOW(), NULL),
    ('clp0000000000000000000000013', 'Creme de Leite', 15000, 0.012, NOW(), NOW(), NULL),
    ('clp0000000000000000000000014', 'Queijo Cream Cheese', 8000, 0.028, NOW(), NOW(), NULL),
    
    -- Ovos e proteínas
    ('clp0000000000000000000000015', 'Ovos', 500, 0.008, NOW(), NOW(), NULL),
    
    -- Chocolates e cacau
    ('clp0000000000000000000000016', 'Chocolate em Pó', 12000, 0.018, NOW(), NOW(), NULL),
    ('clp0000000000000000000000017', 'Cacau em Pó', 8000, 0.025, NOW(), NOW(), NULL),
    ('clp0000000000000000000000018', 'Chocolate Meio Amargo', 10000, 0.035, NOW(), NOW(), NULL),
    ('clp0000000000000000000000019', 'Chocolate Branco', 6000, 0.030, NOW(), NOW(), NULL),
    
    -- Oleaginosas
    ('clp0000000000000000000000020', 'Amêndoas', 8000, 0.042, NOW(), NOW(), NULL),
    ('clp0000000000000000000000021', 'Avelãs', 5000, 0.055, NOW(), NOW(), NULL),
    ('clp0000000000000000000000022', 'Nozes', 4000, 0.048, NOW(), NOW(), NULL),
    ('clp0000000000000000000000023', 'Castanha do Pará', 3000, 0.052, NOW(), NOW(), NULL),
    ('clp0000000000000000000000024', 'Amendoim', 6000, 0.012, NOW(), NOW(), NULL),
    
    -- Frutas e conservas
    ('clp0000000000000000000000025', 'Morango', 10000, 0.015, NOW(), NOW(), NULL),
    ('clp0000000000000000000000026', 'Banana', 15000, 0.004, NOW(), NOW(), NULL),
    ('clp0000000000000000000000027', 'Limão', 5000, 0.003, NOW(), NOW(), NULL),
    ('clp0000000000000000000000028', 'Coco Ralado', 8000, 0.014, NOW(), NOW(), NULL),
    
    -- Fermentos e leveduras
    ('clp0000000000000000000000029', 'Fermento em Pó', 3000, 0.025, NOW(), NOW(), NULL),
    ('clp0000000000000000000000030', 'Fermento Biológico', 2000, 0.020, NOW(), NOW(), NULL),
    
    -- Essências e aromas
    ('clp0000000000000000000000031', 'Baunilha', 1500, 0.180, NOW(), NOW(), NULL),
    ('clp0000000000000000000000032', 'Essência de Baunilha', 2000, 0.080, NOW(), NOW(), NULL),
    ('clp0000000000000000000000033', 'Canela em Pó', 2000, 0.035, NOW(), NOW(), NULL),
    ('clp0000000000000000000000034', 'Noz Moscada', 500, 0.120, NOW(), NOW(), NULL),
    
    -- Gelatinas e estabilizantes
    ('clp0000000000000000000000035', 'Gelatina em Pó', 2500, 0.085, NOW(), NOW(), NULL),
    ('clp0000000000000000000000036', 'Ágar-Ágar', 1000, 0.150, NOW(), NOW(), NULL),
    
    -- Corantes e decorações
    ('clp0000000000000000000000037', 'Corante Alimentício Vermelho', 500, 0.200, NOW(), NOW(), NULL),
    ('clp0000000000000000000000038', 'Corante Alimentício Azul', 500, 0.200, NOW(), NOW(), NULL),
    ('clp0000000000000000000000039', 'Corante Alimentício Amarelo', 500, 0.200, NOW(), NOW(), NULL),
    ('clp0000000000000000000000040', 'Corante Alimentício Verde', 500, 0.200, NOW(), NOW(), NULL),
    ('clp0000000000000000000000041', 'Confeitos Coloridos', 3000, 0.045, NOW(), NOW(), NULL),
    ('clp0000000000000000000000042', 'Granulado', 4000, 0.025, NOW(), NOW(), NULL),
    
    -- Óleos e gorduras
    ('clp0000000000000000000000043', 'Óleo de Soja', 15000, 0.006, NOW(), NOW(), NULL),
    ('clp0000000000000000000000044', 'Óleo de Coco', 5000, 0.022, NOW(), NOW(), NULL),
    
    -- Temperos básicos
    ('clp0000000000000000000000045', 'Sal', 5000, 0.0015, NOW(), NOW(), NULL),
    ('clp0000000000000000000000046', 'Bicarbonato de Sódio', 2000, 0.008, NOW(), NOW(), NULL),
    
    -- Extras
    ('clp0000000000000000000000047', 'Coco Desidratado', 4000, 0.018, NOW(), NOW(), NULL),
    ('clp0000000000000000000000048', 'Passas', 3000, 0.020, NOW(), NOW(), NULL),
    ('clp0000000000000000000000049', 'Tâmara', 2000, 0.025, NOW(), NOW(), NULL)
ON CONFLICT (id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    "pricePerGram" = EXCLUDED."pricePerGram",
    "updatedAt" = NOW();

-- ============================================
-- CRIAR RECEITAS
-- ============================================
WITH receitas_data AS (
    SELECT * FROM (VALUES
        ('clr0000000000000000000000001', 'Bolo de Chocolate'),
        ('clr0000000000000000000000002', 'Cupcake de Baunilha'),
        ('clr0000000000000000000000003', 'Torta de Morango'),
        ('clr0000000000000000000000004', 'Brigadeiro Gourmet'),
        ('clr0000000000000000000000005', 'Brigadeiro Branco'),
        ('clr0000000000000000000000006', 'Brownie de Chocolate'),
        ('clr0000000000000000000000007', 'Cheesecake'),
        ('clr0000000000000000000000008', 'Pão de Mel'),
        ('clr0000000000000000000000009', 'Torta de Limão'),
        ('clr0000000000000000000000010', 'Bolo de Coco com Leite'),
        ('clr0000000000000000000000011', 'Cookie de Chocolate'),
        ('clr0000000000000000000000012', 'Torta de Nozes'),
        ('clr0000000000000000000000013', 'Pudim de Leite Condensado'),
        ('clr0000000000000000000000014', 'Bolo de Amêndoas'),
        ('clr0000000000000000000000015', 'Cupcake de Chocolate'),
        ('clr0000000000000000000000016', 'Torta de Banana'),
        ('clr0000000000000000000000017', 'Brigadeiro de Coco'),
        ('clr0000000000000000000000018', 'Bolo Red Velvet'),
        ('clr0000000000000000000000019', 'Torta de Amendoim'),
        ('clr0000000000000000000000020', 'Bolo de Coco')
    ) AS t(id, name)
)
INSERT INTO "Recipe" (id, name, "createdAt", "updatedAt", "deletedAt")
SELECT id, name, NOW(), NOW(), NULL
FROM receitas_data
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CRIAR INGREDIENTES DAS RECEITAS
-- ============================================
WITH produtos_map AS (
    SELECT id, name FROM "Product" WHERE "deletedAt" IS NULL
),
receitas_map AS (
    SELECT id, name FROM "Recipe" WHERE "deletedAt" IS NULL
),
ingredientes_data AS (
    SELECT * FROM (VALUES
        -- Bolo de Chocolate
        ('Bolo de Chocolate', 'Farinha de Trigo', 300),
        ('Bolo de Chocolate', 'Açúcar Refinado', 200),
        ('Bolo de Chocolate', 'Chocolate em Pó', 100),
        ('Bolo de Chocolate', 'Ovos', 150),
        ('Bolo de Chocolate', 'Leite', 200),
        ('Bolo de Chocolate', 'Óleo de Soja', 100),
        ('Bolo de Chocolate', 'Fermento em Pó', 15),
        
        -- Cupcake de Baunilha
        ('Cupcake de Baunilha', 'Farinha de Trigo', 200),
        ('Cupcake de Baunilha', 'Açúcar Refinado', 150),
        ('Cupcake de Baunilha', 'Manteiga', 100),
        ('Cupcake de Baunilha', 'Ovos', 100),
        ('Cupcake de Baunilha', 'Leite', 100),
        ('Cupcake de Baunilha', 'Essência de Baunilha', 5),
        ('Cupcake de Baunilha', 'Fermento em Pó', 10),
        
        -- Torta de Morango
        ('Torta de Morango', 'Farinha de Trigo', 250),
        ('Torta de Morango', 'Açúcar Refinado', 100),
        ('Torta de Morango', 'Manteiga', 150),
        ('Torta de Morango', 'Ovos', 100),
        ('Torta de Morango', 'Creme de Leite', 300),
        ('Torta de Morango', 'Gelatina em Pó', 20),
        ('Torta de Morango', 'Morango', 500),
        
        -- Brigadeiro Gourmet
        ('Brigadeiro Gourmet', 'Leite Condensado', 400),
        ('Brigadeiro Gourmet', 'Chocolate em Pó', 50),
        ('Brigadeiro Gourmet', 'Manteiga', 20),
        ('Brigadeiro Gourmet', 'Avelãs', 30),
        
        -- Brigadeiro Branco
        ('Brigadeiro Branco', 'Leite Condensado', 400),
        ('Brigadeiro Branco', 'Chocolate Branco', 100),
        ('Brigadeiro Branco', 'Manteiga', 20),
        
        -- Brownie de Chocolate
        ('Brownie de Chocolate', 'Chocolate Meio Amargo', 200),
        ('Brownie de Chocolate', 'Manteiga', 150),
        ('Brownie de Chocolate', 'Açúcar Refinado', 200),
        ('Brownie de Chocolate', 'Ovos', 150),
        ('Brownie de Chocolate', 'Farinha de Trigo', 100),
        ('Brownie de Chocolate', 'Cacau em Pó', 50),
        
        -- Cheesecake
        ('Cheesecake', 'Queijo Cream Cheese', 500),
        ('Cheesecake', 'Açúcar Refinado', 150),
        ('Cheesecake', 'Ovos', 150),
        ('Cheesecake', 'Creme de Leite', 200),
        ('Cheesecake', 'Essência de Baunilha', 10),
        ('Cheesecake', 'Farinha de Trigo', 200),
        
        -- Pão de Mel
        ('Pão de Mel', 'Farinha de Trigo', 400),
        ('Pão de Mel', 'Açúcar Refinado', 150),
        ('Pão de Mel', 'Mel', 200),
        ('Pão de Mel', 'Ovos', 100),
        ('Pão de Mel', 'Leite', 150),
        ('Pão de Mel', 'Canela em Pó', 10),
        ('Pão de Mel', 'Fermento em Pó', 15),
        
        -- Torta de Limão
        ('Torta de Limão', 'Farinha de Trigo', 300),
        ('Torta de Limão', 'Manteiga', 150),
        ('Torta de Limão', 'Açúcar Refinado', 100),
        ('Torta de Limão', 'Leite Condensado', 400),
        ('Torta de Limão', 'Limão', 200),
        ('Torta de Limão', 'Gelatina em Pó', 15),
        
        -- Bolo de Coco com Leite
        ('Bolo de Coco com Leite', 'Farinha de Trigo', 300),
        ('Bolo de Coco com Leite', 'Açúcar Refinado', 200),
        ('Bolo de Coco com Leite', 'Óleo de Soja', 150),
        ('Bolo de Coco com Leite', 'Ovos', 150),
        ('Bolo de Coco com Leite', 'Coco Ralado', 200),
        ('Bolo de Coco com Leite', 'Leite', 200),
        ('Bolo de Coco com Leite', 'Fermento em Pó', 15),
        
        -- Cookie de Chocolate
        ('Cookie de Chocolate', 'Farinha de Trigo', 250),
        ('Cookie de Chocolate', 'Açúcar Refinado', 150),
        ('Cookie de Chocolate', 'Manteiga', 120),
        ('Cookie de Chocolate', 'Ovos', 50),
        ('Cookie de Chocolate', 'Chocolate Meio Amargo', 200),
        ('Cookie de Chocolate', 'Fermento em Pó', 5),
        
        -- Torta de Nozes
        ('Torta de Nozes', 'Farinha de Trigo', 200),
        ('Torta de Nozes', 'Nozes', 300),
        ('Torta de Nozes', 'Açúcar Refinado', 150),
        ('Torta de Nozes', 'Manteiga', 100),
        ('Torta de Nozes', 'Ovos', 100),
        
        -- Pudim de Leite Condensado
        ('Pudim de Leite Condensado', 'Leite Condensado', 400),
        ('Pudim de Leite Condensado', 'Leite', 400),
        ('Pudim de Leite Condensado', 'Ovos', 150),
        ('Pudim de Leite Condensado', 'Açúcar Refinado', 100),
        
        -- Bolo de Amêndoas
        ('Bolo de Amêndoas', 'Farinha de Amêndoas', 300),
        ('Bolo de Amêndoas', 'Açúcar Refinado', 200),
        ('Bolo de Amêndoas', 'Manteiga', 150),
        ('Bolo de Amêndoas', 'Ovos', 200),
        ('Bolo de Amêndoas', 'Amêndoas', 100),
        
        -- Cupcake de Chocolate
        ('Cupcake de Chocolate', 'Farinha de Trigo', 180),
        ('Cupcake de Chocolate', 'Açúcar Refinado', 150),
        ('Cupcake de Chocolate', 'Chocolate em Pó', 50),
        ('Cupcake de Chocolate', 'Manteiga', 100),
        ('Cupcake de Chocolate', 'Ovos', 100),
        ('Cupcake de Chocolate', 'Leite', 120),
        ('Cupcake de Chocolate', 'Fermento em Pó', 10),
        
        -- Torta de Banana
        ('Torta de Banana', 'Farinha de Trigo', 250),
        ('Torta de Banana', 'Açúcar Refinado', 150),
        ('Torta de Banana', 'Banana', 600),
        ('Torta de Banana', 'Manteiga', 100),
        ('Torta de Banana', 'Ovos', 100),
        ('Torta de Banana', 'Canela em Pó', 10),
        
        -- Brigadeiro de Coco
        ('Brigadeiro de Coco', 'Leite Condensado', 400),
        ('Brigadeiro de Coco', 'Coco Ralado', 150),
        ('Brigadeiro de Coco', 'Manteiga', 20),
        
        -- Bolo Red Velvet
        ('Bolo Red Velvet', 'Farinha de Trigo', 300),
        ('Bolo Red Velvet', 'Açúcar Refinado', 200),
        ('Bolo Red Velvet', 'Manteiga', 150),
        ('Bolo Red Velvet', 'Ovos', 150),
        ('Bolo Red Velvet', 'Leite', 200),
        ('Bolo Red Velvet', 'Corante Alimentício Vermelho', 5),
        ('Bolo Red Velvet', 'Essência de Baunilha', 10),
        ('Bolo Red Velvet', 'Fermento em Pó', 15),
        
        -- Torta de Amendoim
        ('Torta de Amendoim', 'Farinha de Trigo', 200),
        ('Torta de Amendoim', 'Amendoim', 300),
        ('Torta de Amendoim', 'Açúcar Refinado', 150),
        ('Torta de Amendoim', 'Manteiga', 120),
        ('Torta de Amendoim', 'Ovos', 100),
        
        -- Bolo de Coco
        ('Bolo de Coco', 'Farinha de Trigo', 300),
        ('Bolo de Coco', 'Açúcar Refinado', 200),
        ('Bolo de Coco', 'Coco Ralado', 200),
        ('Bolo de Coco', 'Leite', 200),
        ('Bolo de Coco', 'Ovos', 150),
        ('Bolo de Coco', 'Óleo de Coco', 100),
        ('Bolo de Coco', 'Fermento em Pó', 15)
    ) AS t(recipe_name, product_name, amount)
)
INSERT INTO "RecipeIngredient" (id, "recipeId", "productId", amount)
SELECT 
    'cli' || LPAD((ROW_NUMBER() OVER ())::text, 24, '0') as id,
    r.id as "recipeId",
    p.id as "productId",
    i.amount
FROM ingredientes_data i
JOIN receitas_map r ON r.name = i.recipe_name
JOIN produtos_map p ON p.name = i.product_name
ON CONFLICT ("recipeId", "productId") DO UPDATE SET
    amount = EXCLUDED.amount;

-- ============================================
-- CRIAR HISTÓRICO DE CONSUMO (ÚLTIMOS 90 DIAS)
-- ============================================
-- Gerar consumos para os últimos 90 dias (simplificado para SQL)
DO $$
DECLARE
    produto_record RECORD;
    dia_atual DATE;
    consumo_id TEXT;
    consumo_num INT;
    quantidade NUMERIC;
    razao TEXT;
    razoes TEXT[] := ARRAY[
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
        'Preparacao para evento'
    ];
    counter INT := 1;
BEGIN
    FOR produto_record IN SELECT id, name FROM "Product" WHERE "deletedAt" IS NULL LOOP
        FOR dia_atual IN SELECT generate_series(
            CURRENT_DATE - INTERVAL '90 days',
            CURRENT_DATE,
            '1 day'::interval
        )::date LOOP
            -- Criar 3-8 consumos por dia (aleatório)
            consumo_num := FLOOR(RANDOM() * 6 + 3)::INT;
            
            FOR i IN 1..consumo_num LOOP
                -- Calcular quantidade baseada no tipo de produto
                IF produto_record.name LIKE '%Farinha%' OR produto_record.name LIKE '%Açúcar%' THEN
                    quantidade := (RANDOM() * 2000 + 500)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Ovos%' THEN
                    quantidade := (RANDOM() * 30 + 10)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Leite%' OR produto_record.name LIKE '%Creme%' THEN
                    quantidade := (RANDOM() * 3000 + 500)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Chocolate%' OR produto_record.name LIKE '%Cacau%' THEN
                    quantidade := (RANDOM() * 1000 + 200)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Manteiga%' OR produto_record.name LIKE '%Margarina%' THEN
                    quantidade := (RANDOM() * 2000 + 300)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Fermento%' THEN
                    quantidade := (RANDOM() * 100 + 20)::NUMERIC(10,2);
                ELSIF produto_record.name LIKE '%Amêndoas%' OR produto_record.name LIKE '%Avelãs%' OR produto_record.name LIKE '%Nozes%' THEN
                    quantidade := (RANDOM() * 500 + 100)::NUMERIC(10,2);
                ELSE
                    quantidade := (RANDOM() * 1000 + 100)::NUMERIC(10,2);
                END IF;
                
                razao := razoes[FLOOR(RANDOM() * array_length(razoes, 1) + 1)];
                consumo_id := 'clc' || LPAD(counter::TEXT, 24, '0');
                counter := counter + 1;
                
                INSERT INTO "Consumption" (id, "productId", amount, reason, "createdAt")
                VALUES (
                    consumo_id,
                    produto_record.id,
                    quantidade,
                    razao,
                    (dia_atual + (RANDOM() * INTERVAL '24 hours') + (RANDOM() * INTERVAL '60 minutes'))::TIMESTAMP
                )
                ON CONFLICT (id) DO NOTHING;
                
                -- Limitar a 500 registros para não sobrecarregar
                IF counter > 500 THEN
                    EXIT;
                END IF;
            END LOOP;
            
            IF counter > 500 THEN
                EXIT;
            END IF;
        END LOOP;
        
        IF counter > 500 THEN
            EXIT;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- ============================================
-- RESUMO
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM "User") as total_usuarios,
    (SELECT COUNT(*) FROM "Product") as total_produtos,
    (SELECT COUNT(*) FROM "Recipe") as total_receitas,
    (SELECT COUNT(*) FROM "RecipeIngredient") as total_ingredientes,
    (SELECT COUNT(*) FROM "Consumption") as total_consumos;

