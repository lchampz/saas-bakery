-- Script para verificar se todas as alterações foram aplicadas

-- Verificar colunas adicionadas em Product
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('unit', 'minLevel', 'supplierId')
ORDER BY column_name;

-- Verificar colunas adicionadas em User
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'role';

-- Verificar colunas adicionadas em Recipe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Recipe' 
AND column_name IN ('totalCost', 'servingSize', 'instructions')
ORDER BY column_name;

-- Verificar se tabelas novas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Supplier', 'Purchase', 'PurchaseItem')
ORDER BY table_name;

-- Verificar foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (ccu.table_name IN ('Supplier', 'Purchase', 'PurchaseItem')
     OR tc.table_name IN ('Product', 'Purchase', 'PurchaseItem'))
ORDER BY tc.table_name, kcu.column_name;

