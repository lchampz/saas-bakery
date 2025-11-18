#!/bin/bash

# Script para Validar Configuração Terraform

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}✔️  Validação de Configuração${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta infrastructure/${NC}"
    exit 1
fi

# Verificar se terraform.tfvars existe
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ Arquivo terraform.tfvars não encontrado!${NC}"
    echo -e "${YELLOW}💡 Copie terraform.tfvars.example para terraform.tfvars e configure${NC}"
    exit 1
fi

# Verificar se Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform não está instalado!${NC}"
    exit 1
fi

# Formatar código
echo -e "${YELLOW}📝 Formatando código Terraform...${NC}"
terraform fmt -recursive

# Inicializar (se necessário)
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}📦 Inicializando Terraform...${NC}"
    terraform init
fi

# Validar sintaxe
echo -e "${YELLOW}✔️  Validando sintaxe...${NC}"
if terraform validate; then
    echo -e "${GREEN}✅ Validação bem-sucedida!${NC}"
else
    echo -e "${RED}❌ Erros encontrados na validação!${NC}"
    exit 1
fi

# Verificar plano (sem aplicar)
echo -e "${YELLOW}📋 Verificando plano...${NC}"
terraform plan -out=/dev/null

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Tudo pronto para deploy!${NC}"
echo -e "${GREEN}========================================${NC}"

