#!/bin/bash

# Script de deploy do frontend para Azure App Service
# Uso: ./deploy.sh [app-service-name] [resource-group]

# Não usar set -e aqui para permitir tratamento de erros de autenticação

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando deploy do frontend...${NC}"

# Verificar se Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI não está instalado. Instale em: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Verificar se está logado no Azure e se o token é válido
echo -e "${GREEN}🔐 Verificando autenticação no Azure...${NC}"

# Função para verificar e fazer login se necessário
check_azure_auth() {
    if ! az account show &> /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Não está logado no Azure. Fazendo login...${NC}"
        az login
        return $?
    fi
    
    # Tentar um comando simples para verificar se o token é válido
    if ! az account show --query id -o tsv &> /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Token pode estar expirado. Tentando renovar...${NC}"
        az account get-access-token &> /dev/null 2>&1 || {
            echo -e "${YELLOW}⚠️  Token expirado. Fazendo login novamente...${NC}"
            az logout 2>/dev/null || true
            az login
            return $?
        }
    fi
    
    echo -e "${GREEN}✅ Autenticado no Azure${NC}"
    return 0
}

# Verificar autenticação
if ! check_azure_auth; then
    echo -e "${RED}❌ Falha na autenticação. Tente fazer login manualmente: az login${NC}"
    exit 1
fi

# Obter parâmetros
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  Nome do App Service não fornecido. Tentando obter do Terraform...${NC}"
    cd ../infrastructure
    APP_SERVICE_NAME=$(terraform output -raw app_service_name 2>/dev/null || echo "")
    RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "")
    cd ../frontend
    
    if [ -z "$APP_SERVICE_NAME" ]; then
        echo -e "${RED}❌ Não foi possível obter o nome do App Service. Forneça como parâmetro:${NC}"
        echo "   ./deploy.sh app-fratelli-frontend-dev-xxx rg-fratelli-dev"
        exit 1
    fi
else
    APP_SERVICE_NAME=$1
    RESOURCE_GROUP=$2
fi

if [ -z "$RESOURCE_GROUP" ]; then
    echo -e "${YELLOW}⚠️  Resource Group não fornecido. Tentando obter do Terraform...${NC}"
    cd ../infrastructure
    RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "")
    cd ../frontend
    
    if [ -z "$RESOURCE_GROUP" ]; then
        echo -e "${RED}❌ Não foi possível obter o Resource Group. Forneça como parâmetro:${NC}"
        echo "   ./deploy.sh $APP_SERVICE_NAME rg-fratelli-dev"
        exit 1
    fi
fi

echo -e "${GREEN}📦 App Service: ${APP_SERVICE_NAME}${NC}"
echo -e "${GREEN}📦 Resource Group: ${RESOURCE_GROUP}${NC}"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Instalando dependências...${NC}"
    npm install
fi

# Fazer build do projeto
echo -e "${GREEN}🔨 Fazendo build do projeto...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Pasta dist não foi criada. Verifique os erros de build.${NC}"
    exit 1
fi

# Criar arquivo .deployment se não existir
if [ ! -f ".deployment" ]; then
    echo -e "${YELLOW}⚠️  Criando arquivo .deployment...${NC}"
    cat > .deployment << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
EOF
fi

# Criar arquivo web.config para Azure (opcional, mas ajuda)
if [ ! -f "web.config" ]; then
    echo -e "${YELLOW}⚠️  Criando web.config para Azure...${NC}"
    cat > web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
EOF
fi

# Copiar server.js e startup.sh para dist
echo -e "${GREEN}📦 Preparando arquivos para deploy...${NC}"
cp server.js dist/
if [ -f "startup.sh" ]; then
    cp startup.sh dist/
    chmod +x dist/startup.sh
fi

# Criar package.json mínimo na dist (sem type: module)
# IMPORTANTE: Este package.json deve ter apenas as dependências do servidor
cat > dist/package.json << 'EOF'
{
  "name": "fratelli-frontend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "postinstall": "echo 'Dependências instaladas'"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Criar .npmrc para garantir instalação correta
cat > dist/.npmrc << 'EOF'
production=true
package-lock=false
EOF

# Fazer deploy usando Azure CLI
echo -e "${GREEN}🚀 Fazendo deploy para Azure App Service...${NC}"
echo -e "${YELLOW}⚠️  Isso pode levar alguns minutos...${NC}"

# Deploy via zip (mais rápido e confiável)
cd dist
zip -r ../deploy.zip . > /dev/null
cd ..

# Tentar fazer deploy, se falhar por autenticação, tentar login novamente
DEPLOY_OUTPUT=$(mktemp)
if ! az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --src-path deploy.zip \
    --type zip 2>&1 | tee "$DEPLOY_OUTPUT"; then
    
    # Verificar se o erro é de autenticação
    if grep -qi "AADSTS\|refresh token\|authentication\|expired\|invalid" "$DEPLOY_OUTPUT"; then
        echo -e "${YELLOW}⚠️  Erro de autenticação detectado. Fazendo login novamente...${NC}"
        az logout 2>/dev/null || true
        if ! az login; then
            echo -e "${RED}❌ Falha no login. Tente fazer login manualmente: az login${NC}"
            rm -f deploy.zip "$DEPLOY_OUTPUT"
            exit 1
        fi
        
        # Tentar novamente
        echo -e "${GREEN}🔄 Tentando deploy novamente após login...${NC}"
        rm -f "$DEPLOY_OUTPUT"
        if ! az webapp deploy \
            --resource-group "$RESOURCE_GROUP" \
            --name "$APP_SERVICE_NAME" \
            --src-path deploy.zip \
            --type zip; then
            echo -e "${RED}❌ Falha no deploy após login. Verifique os erros acima.${NC}"
            rm -f deploy.zip
            exit 1
        fi
    else
        echo -e "${RED}❌ Falha no deploy. Verifique os erros acima.${NC}"
        rm -f deploy.zip "$DEPLOY_OUTPUT"
        exit 1
    fi
fi

rm -f "$DEPLOY_OUTPUT"

# Limpar arquivo temporário
rm -f deploy.zip

# Instalar dependências no App Service
echo -e "${GREEN}📦 Configurando App Service...${NC}"
if az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output none 2>/dev/null; then
    echo -e "${GREEN}✅ Configurações atualizadas${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível atualizar configurações (pode ser normal)${NC}"
fi

# Aguardar um pouco para o deploy finalizar
echo -e "${GREEN}⏳ Aguardando deploy finalizar...${NC}"
sleep 5

echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo -e "${GREEN}🌐 Acesse: https://${APP_SERVICE_NAME}.azurewebsites.net${NC}"

# Obter URL do App Service
if APP_URL=$(az webapp show --name "$APP_SERVICE_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv 2>/dev/null); then
    echo -e "${GREEN}🔗 URL: https://${APP_URL}${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível obter a URL, mas o deploy foi concluído${NC}"
fi

