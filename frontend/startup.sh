#!/bin/sh
# Script de startup para Azure App Service
# Este script garante que as dependências estejam instaladas antes de iniciar

echo "🚀 Iniciando aplicação..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --production --no-audit --no-fund
fi

# Verificar se express está instalado
if [ ! -d "node_modules/express" ]; then
    echo "⚠️  Express não encontrado, reinstalando..."
    npm install express --production --no-audit --no-fund
fi

# Iniciar o servidor
echo "✅ Iniciando servidor Node.js..."
exec node server.js

