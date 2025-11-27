#!/bin/bash

# Script para baixar modelos no Ollama
# Uso: ./setup-model.sh [modelo] [vm-address]

MODEL=${1:-llama3.2}
VM_ADDRESS=${2:-localhost}

if [ "$VM_ADDRESS" = "localhost" ]; then
    # Local
    echo "📥 Baixando modelo $MODEL localmente..."
    docker exec -it ollama-service ollama pull $MODEL
else
    # Remoto (Azure VM)
    echo "📥 Baixando modelo $MODEL na VM $VM_ADDRESS..."
    ssh $VM_ADDRESS "docker exec -it ollama-service ollama pull $MODEL"
fi

echo "✅ Modelo $MODEL baixado com sucesso!"
echo ""
echo "📋 Modelos disponíveis:"
if [ "$VM_ADDRESS" = "localhost" ]; then
    docker exec -it ollama-service ollama list
else
    ssh $VM_ADDRESS "docker exec -it ollama-service ollama list"
fi

