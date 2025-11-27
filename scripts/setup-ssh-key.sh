#!/bin/bash

# Script para configurar chave SSH no terraform.tfvars

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TFVARS_FILE="$PROJECT_ROOT/infrastructure/terraform.tfvars"

echo "🔑 Configurando chave SSH para Terraform..."
echo ""

# Verificar se já existe chave SSH
if [ -f ~/.ssh/id_rsa.pub ]; then
    SSH_KEY=$(cat ~/.ssh/id_rsa.pub)
    echo "✅ Chave SSH encontrada: ~/.ssh/id_rsa.pub"
elif [ -f ~/.ssh/id_ed25519.pub ]; then
    SSH_KEY=$(cat ~/.ssh/id_ed25519.pub)
    echo "✅ Chave SSH encontrada: ~/.ssh/id_ed25519.pub"
else
    echo "❌ Nenhuma chave SSH pública encontrada"
    echo ""
    read -p "Deseja gerar uma nova chave SSH? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Email para a chave SSH: " SSH_EMAIL
        ssh-keygen -t rsa -b 4096 -C "$SSH_EMAIL" -f ~/.ssh/id_rsa -N ""
        SSH_KEY=$(cat ~/.ssh/id_rsa.pub)
        echo "✅ Chave SSH gerada: ~/.ssh/id_rsa.pub"
    else
        echo "❌ É necessário ter uma chave SSH pública"
        echo "   Gere uma com: ssh-keygen -t rsa -b 4096 -C 'seu-email@exemplo.com'"
        exit 1
    fi
fi

echo ""
echo "📋 Chave SSH:"
echo "$SSH_KEY"
echo ""

# Atualizar terraform.tfvars
if [ -f "$TFVARS_FILE" ]; then
    # Escapar caracteres especiais para sed
    ESCAPED_KEY=$(echo "$SSH_KEY" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Atualizar a linha ollama_vm_ssh_public_key
    if grep -q "ollama_vm_ssh_public_key" "$TFVARS_FILE"; then
        # macOS usa uma sintaxe diferente do sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|ollama_vm_ssh_public_key = .*|ollama_vm_ssh_public_key = \"$ESCAPED_KEY\"|" "$TFVARS_FILE"
        else
            sed -i "s|ollama_vm_ssh_public_key = .*|ollama_vm_ssh_public_key = \"$ESCAPED_KEY\"|" "$TFVARS_FILE"
        fi
        echo "✅ terraform.tfvars atualizado com a chave SSH"
    else
        echo "⚠️  Variável ollama_vm_ssh_public_key não encontrada em terraform.tfvars"
        echo "   Adicione manualmente:"
        echo "   ollama_vm_ssh_public_key = \"$SSH_KEY\""
    fi
else
    echo "⚠️  Arquivo terraform.tfvars não encontrado"
    echo "   Adicione manualmente:"
    echo "   ollama_vm_ssh_public_key = \"$SSH_KEY\""
fi

echo ""
echo "✅ Configuração concluída!"

