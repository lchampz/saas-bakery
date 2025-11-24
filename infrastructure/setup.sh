#!/bin/bash

# Script de setup automático da infraestrutura
# Lê variáveis do terraform.tfvars e faz todo o setup

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Setup Automático - Infraestrutura Fratelli        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório infrastructure/${NC}"
    exit 1
fi

# Verificar se terraform.tfvars existe
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ Erro: arquivo terraform.tfvars não encontrado${NC}"
    echo -e "${YELLOW}💡 Crie o arquivo terraform.tfvars com as configurações necessárias${NC}"
    exit 1
fi

# Verificar se Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI não está instalado. Instale em: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Verificar autenticação Azure
echo -e "${GREEN}🔐 Verificando autenticação no Azure...${NC}"
if ! az account show &> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Não está logado no Azure. Fazendo login...${NC}"
    az login
fi

# Verificar se o subscription_id do tfvars corresponde ao atual
TFVARS_SUB=$(grep "^subscription_id" terraform.tfvars | cut -d'"' -f2 | tr -d ' ')
CURRENT_SUB=$(az account show --query id -o tsv 2>/dev/null || echo "")

if [ -n "$TFVARS_SUB" ] && [ -n "$CURRENT_SUB" ] && [ "$TFVARS_SUB" != "$CURRENT_SUB" ]; then
    echo -e "${YELLOW}⚠️  Subscription ID no terraform.tfvars ($TFVARS_SUB) difere do atual ($CURRENT_SUB)${NC}"
    echo -e "${YELLOW}💡 Deseja alterar para a subscription do terraform.tfvars? (s/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
        az account set --subscription "$TFVARS_SUB"
        echo -e "${GREEN}✅ Subscription alterada${NC}"
    fi
fi

# Ler variáveis do terraform.tfvars
echo -e "${GREEN}📖 Lendo configurações do terraform.tfvars...${NC}"
PROJECT_NAME=$(grep "^project_name" terraform.tfvars | cut -d'"' -f2 | tr -d ' ')
ENVIRONMENT=$(grep "^environment" terraform.tfvars | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d '#')
LOCATION=$(grep "^location" terraform.tfvars | cut -d'"' -f2 | tr -d ' ')

echo -e "${BLUE}📦 Projeto: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}🌍 Ambiente: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}📍 Região: ${LOCATION}${NC}"
echo ""

# Inicializar Terraform
echo -e "${GREEN}🔧 Inicializando Terraform...${NC}"
terraform init -upgrade

# Validar configuração
echo -e "${GREEN}✅ Validando configuração...${NC}"
if ! terraform validate; then
    echo -e "${RED}❌ Erro na validação do Terraform${NC}"
    exit 1
fi

# Mostrar plano
echo -e "${GREEN}📋 Gerando plano de execução...${NC}"
terraform plan -out=tfplan

echo ""
echo -e "${YELLOW}⚠️  O plano acima mostra o que será criado/modificado${NC}"
echo -e "${YELLOW}💡 Deseja continuar e aplicar as mudanças? (s/N)${NC}"
read -r response

if [[ ! "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada pelo usuário${NC}"
    exit 0
fi

# Aplicar mudanças
echo -e "${GREEN}🚀 Aplicando mudanças...${NC}"
echo -e "${YELLOW}⏳ Isso pode levar alguns minutos...${NC}"
terraform apply tfplan

# Mostrar outputs
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ Setup Concluído!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Informações da Infraestrutura:${NC}"
echo ""

echo -e "${BLUE}🔹 Resource Group:${NC} $(terraform output -raw resource_group_name 2>/dev/null || echo 'N/A')"
echo -e "${BLUE}🔹 PostgreSQL Server:${NC} $(terraform output -raw postgres_server_fqdn 2>/dev/null || echo 'N/A')"
echo -e "${BLUE}🔹 Backend URL:${NC} $(terraform output -raw backend_app_service_url 2>/dev/null || echo 'N/A')"
echo -e "${BLUE}🔹 Key Vault:${NC} $(terraform output -raw key_vault_name 2>/dev/null || echo 'N/A')"

echo ""
echo -e "${GREEN}💡 Próximos passos:${NC}"
echo -e "   1. Configure a variável DATABASE_URL no backend usando o Key Vault"
echo -e "   2. Faça deploy do backend para: $(terraform output -raw backend_app_service_url 2>/dev/null || echo 'N/A')"
echo -e "   3. Acesse o Key Vault para obter a DATABASE_URL: $(terraform output -raw key_vault_uri 2>/dev/null || echo 'N/A')"
echo ""

# Limpar arquivo de plano
rm -f tfplan

echo -e "${GREEN}✅ Setup completo!${NC}"

