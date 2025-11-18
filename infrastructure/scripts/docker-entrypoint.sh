#!/bin/sh

# Script de entrada para container Docker com Terraform

case "$1" in
  deploy)
    echo "🚀 Executando deploy..."
    terraform init
    terraform validate
    terraform plan -out=tfplan
    terraform apply tfplan
    rm -f tfplan
    ;;
  destroy)
    echo "🗑️  Removendo infraestrutura..."
    terraform destroy -auto-approve
    ;;
  plan)
    echo "📋 Mostrando plano..."
    terraform init
    terraform plan
    ;;
  validate)
    echo "✔️  Validando..."
    terraform init
    terraform validate
    terraform fmt -check
    ;;
  *)
    echo "Uso: docker run <image> [deploy|destroy|plan|validate]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  deploy   - Criar infraestrutura"
    echo "  destroy  - Remover infraestrutura"
    echo "  plan     - Mostrar plano de execução"
    echo "  validate - Validar configuração"
    exit 1
    ;;
esac

