#!/bin/bash

# Script para Remover Infraestrutura Azure
# ATENÇÃO: Este script remove TODOS os recursos criados!

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}⚠️  REMOÇÃO DE INFRAESTRUTURA AZURE${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta infrastructure/${NC}"
    exit 1
fi

# Verificar se Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform não está instalado!${NC}"
    exit 1
fi

# Confirmar remoção
echo -e "${RED}⚠️  ATENÇÃO: Isso irá REMOVER TODOS os recursos criados!${NC}"
echo -e "${RED}⚠️  Esta ação NÃO pode ser desfeita!${NC}"
echo ""
read -p "Digite 'REMOVER' para confirmar: " -r
echo ""

if [[ ! $REPLY == "REMOVER" ]]; then
    echo -e "${YELLOW}❌ Remoção cancelada${NC}"
    exit 0
fi

# Mostrar o que será destruído
echo -e "${YELLOW}📋 Mostrando recursos que serão removidos...${NC}"
terraform plan -destroy

# Confirmar novamente
echo ""
read -p "Tem certeza que deseja continuar? (sim/não): " -n 3 -r
echo ""

if [[ ! $REPLY =~ ^[Ss][Ii][Mm]$ ]]; then
    echo -e "${YELLOW}❌ Remoção cancelada${NC}"
    exit 0
fi

# Destruir infraestrutura
echo -e "${RED}🗑️  Removendo infraestrutura...${NC}"
terraform destroy -auto-approve

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Infraestrutura removida com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"

