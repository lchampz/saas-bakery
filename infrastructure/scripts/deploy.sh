#!/bin/bash

# Script de Deploy Automático para Azure
# Este script facilita o deploy da infraestrutura para equipes não técnicas

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Deploy de Infraestrutura Azure${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta infrastructure/${NC}"
    exit 1
fi

# Verificar se terraform.tfvars existe
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  Arquivo terraform.tfvars não encontrado!${NC}"
    echo -e "${YELLOW}📋 Copiando arquivo de exemplo...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${RED}❌ Por favor, edite o arquivo terraform.tfvars com suas configurações antes de continuar!${NC}"
    exit 1
fi

# Verificar se Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI não está instalado!${NC}"
    echo -e "${YELLOW}📥 Instale em: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Verificar se Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform não está instalado!${NC}"
    echo -e "${YELLOW}📥 Instale em: https://www.terraform.io/downloads${NC}"
    exit 1
fi

# Verificar login no Azure
echo -e "${YELLOW}🔐 Verificando login no Azure...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Não está logado no Azure. Fazendo login...${NC}"
    az login
fi

# Mostrar conta atual
ACCOUNT=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logado como: ${ACCOUNT}${NC}"
echo ""

# Inicializar Terraform
echo -e "${YELLOW}📦 Inicializando Terraform...${NC}"
terraform init

# Validar configuração
echo -e "${YELLOW}✔️  Validando configuração...${NC}"
terraform validate

# Mostrar plano
echo -e "${YELLOW}📋 Mostrando plano de execução...${NC}"
terraform plan -out=tfplan

# Confirmar antes de aplicar
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Isso irá criar recursos no Azure que gerarão custos!${NC}"
read -p "Deseja continuar com o deploy? (sim/não): " -n 3 -r
echo ""

if [[ ! $REPLY =~ ^[Ss][Ii][Mm]$ ]]; then
    echo -e "${YELLOW}❌ Deploy cancelado pelo usuário${NC}"
    rm -f tfplan
    exit 0
fi

# Aplicar configuração
echo -e "${GREEN}🚀 Aplicando configuração...${NC}"
terraform apply tfplan

# Limpar arquivo de plano
rm -f tfplan

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Para ver os outputs, execute:${NC}"
echo -e "   terraform output"
echo ""
echo -e "${YELLOW}💰 Não esqueça de monitorar os custos no Azure Portal!${NC}"

