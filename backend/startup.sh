#!/bin/bash

# Script de startup para Azure App Service
set -e

echo "🚀 Iniciando backend..."

# Instalar dependências (incluindo devDependencies que podem ser necessárias)
echo "📦 Instalando dependências..."
npm install --no-audit --no-fund

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Executar migrações do banco de dados
echo "🗄️  Executando migrações do banco de dados..."
npx prisma migrate deploy || echo "⚠️  Aviso: Migrações podem já estar aplicadas"

# Iniciar servidor
echo "✅ Iniciando servidor Node.js na porta ${PORT:-3000}..."
exec node dist/server.js

