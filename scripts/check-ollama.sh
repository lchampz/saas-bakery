#!/bin/bash
set -e

# Script para verificar status do Ollama na VM
# Uso: ./scripts/check-ollama.sh <ip-da-vm>

if [ -z "$1" ]; then
    echo "❌ Uso: ./check-ollama.sh <ip-da-vm>"
    exit 1
fi

VM_IP=$1
SSH_USER="ollamaadmin"

echo "🔍 Verificando status do Ollama na VM $VM_IP..."

# Verificar se a VM está acessível
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${SSH_USER}@${VM_IP} "echo 'VM acessível'" &> /dev/null; then
    echo "❌ VM não está acessível. Verifique:"
    echo "   - Firewall Azure permite SSH (porta 22)"
    echo "   - IP está correto"
    echo "   - Chave SSH está configurada"
    exit 1
fi

echo "✅ VM acessível"

# Verificar Docker
echo "🐳 Verificando Docker..."
if ssh ${SSH_USER}@${VM_IP} "docker --version" &> /dev/null; then
    echo "✅ Docker instalado"
else
    echo "❌ Docker não está instalado"
    exit 1
fi

# Verificar Ollama container
echo "🤖 Verificando container Ollama..."
if ssh ${SSH_USER}@${VM_IP} "docker ps | grep ollama-service" &> /dev/null; then
    echo "✅ Container Ollama está rodando"
else
    echo "⚠️  Container Ollama não está rodando"
    ssh ${SSH_USER}@${VM_IP} "ollama-manage status"
    exit 1
fi

# Verificar API
echo "🌐 Verificando API Ollama..."
API_URL="http://${VM_IP}:11434/api/tags"
if curl -s -f "$API_URL" &> /dev/null; then
    echo "✅ API Ollama está respondendo"
    
    # Listar modelos
    echo ""
    echo "📦 Modelos disponíveis:"
    curl -s "$API_URL" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//' || echo "   Nenhum modelo encontrado"
else
    echo "❌ API Ollama não está respondendo"
    echo "   Verifique se a porta 11434 está aberta no firewall Azure"
    exit 1
fi

echo ""
echo "✅ Ollama está funcionando corretamente!"
echo "🔗 URL da API: http://${VM_IP}:11434"

