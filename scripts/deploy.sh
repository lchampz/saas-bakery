#!/bin/bash
set -e

# ============================================================================
# Script Único de Deploy Completo - Fratelli
# ============================================================================
# Este script faz deploy completo de:
# - Infraestrutura Azure (PostgreSQL, Key Vault, etc.)
# - VM Ollama com detecção automática de capacidade
# - Backend (Azure App Service)
# - Frontend (Vercel)
#
# Uso: ./scripts/deploy.sh [environment]
# Exemplo: ./scripts/deploy.sh production
# ============================================================================

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    print_header "Verificando Pré-requisitos"
    
    local missing=0
    
    # Azure CLI
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI não está instalado"
        echo "   Instale em: https://docs.microsoft.com/cli/azure/install-azure-cli"
        missing=1
    else
        print_success "Azure CLI instalado"
    fi
    
    # Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform não está instalado"
        echo "   Instale em: https://www.terraform.io/downloads"
        missing=1
    else
        print_success "Terraform instalado"
    fi
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        missing=1
    else
        print_success "Node.js instalado (v$(node --version))"
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        missing=1
    else
        print_success "npm instalado (v$(npm --version))"
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Verificar autenticação Azure
check_azure_auth() {
    print_header "Verificando Autenticação Azure"
    
    if ! az account show &> /dev/null; then
        print_error "Não está autenticado no Azure"
        echo ""
        echo "Execute:"
        echo "  az login"
        exit 1
    fi
    
    # Verificar se o token ainda é válido
    if ! az account show --query id -o tsv &> /dev/null; then
        print_warning "Token do Azure expirado. Fazendo login novamente..."
        az login
    fi
    
    local sub_name=$(az account show --query name -o tsv)
    local sub_id=$(az account show --query id -o tsv)
    print_success "Autenticado no Azure"
    echo "   Subscription: $sub_name"
    echo "   ID: $sub_id"
}

# Configurar chave SSH automaticamente
setup_ssh_key() {
    local tfvars_file="$PROJECT_ROOT/infrastructure/terraform.tfvars"
    
    if grep -q "ollama_vm_ssh_public_key = \"ssh-rsa.*\.\.\." "$tfvars_file" 2>/dev/null || ! grep -q "ollama_vm_ssh_public_key" "$tfvars_file" 2>/dev/null; then
        print_warning "Chave SSH não configurada"
        
        # Tentar encontrar chave SSH
        local ssh_key=""
        if [ -f ~/.ssh/id_rsa.pub ]; then
            ssh_key=$(cat ~/.ssh/id_rsa.pub)
            print_success "Chave SSH encontrada: ~/.ssh/id_rsa.pub"
        elif [ -f ~/.ssh/id_ed25519.pub ]; then
            ssh_key=$(cat ~/.ssh/id_ed25519.pub)
            print_success "Chave SSH encontrada: ~/.ssh/id_ed25519.pub"
        else
            print_error "Nenhuma chave SSH pública encontrada"
            echo "   Gere uma com: ssh-keygen -t rsa -b 4096 -C 'seu-email@exemplo.com'"
            exit 1
        fi
        
        # Atualizar terraform.tfvars
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|ollama_vm_ssh_public_key = .*|ollama_vm_ssh_public_key = \"$ssh_key\"|" "$tfvars_file"
        else
            sed -i "s|ollama_vm_ssh_public_key = .*|ollama_vm_ssh_public_key = \"$ssh_key\"|" "$tfvars_file"
        fi
        
        print_success "Chave SSH configurada em terraform.tfvars"
    else
        print_success "Chave SSH já configurada"
    fi
}

# Detectar capacidade de VM automaticamente
detect_vm_capacity() {
    print_header "Detectando Capacidade de VM"
    
    local tfvars_file="$PROJECT_ROOT/infrastructure/terraform.tfvars"
    local infra_dir="$PROJECT_ROOT/infrastructure"
    
    # Configurações para testar (em ordem de preferência - mais econômicas primeiro)
    local configs=(
        "Standard_B1ms:null"
        "Standard_B1ms:1"
        "Standard_B1ms:2"
        "Standard_B1ms:3"
        "Standard_B2s:null"
        "Standard_B2s:1"
        "Standard_B2s:2"
        "Standard_B2s:3"
        "Standard_A1_v2:1"
        "Standard_A1_v2:2"
        "Standard_A1_v2:3"
        "Standard_A1_v2:null"
        "Standard_A2_v2:null"
        "Standard_A2_v2:1"
        "Standard_D2s_v3:null"
        "Standard_D2s_v3:1"
    )
    
    print_step "Testando configurações de VM (isso pode levar alguns minutos)..."
    echo ""
    
    for config in "${configs[@]}"; do
        local size=$(echo $config | cut -d: -f1)
        local zone=$(echo $config | cut -d: -f2)
        
        echo -n "   Testando $size (zona: ${zone:-auto})... "
        
        # Backup
        cp "$tfvars_file" "$tfvars_file.backup"
        
        # Atualizar configuração
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/ollama_vm_size.*=.*/ollama_vm_size = \"$size\"/" "$tfvars_file"
            
            if [ "$zone" = "null" ]; then
                sed -i '' '/ollama_vm_zone/d' "$tfvars_file"
            else
                if grep -q "ollama_vm_zone" "$tfvars_file"; then
                    sed -i '' "s/ollama_vm_zone.*=.*/ollama_vm_zone = $zone/" "$tfvars_file"
                else
                    echo "ollama_vm_zone = $zone" >> "$tfvars_file"
                fi
            fi
        else
            sed -i "s/ollama_vm_size.*=.*/ollama_vm_size = \"$size\"/" "$tfvars_file"
            
            if [ "$zone" = "null" ]; then
                sed -i '/ollama_vm_zone/d' "$tfvars_file"
            else
                if grep -q "ollama_vm_zone" "$tfvars_file"; then
                    sed -i "s/ollama_vm_zone.*=.*/ollama_vm_zone = $zone/" "$tfvars_file"
                else
                    echo "ollama_vm_zone = $zone" >> "$tfvars_file"
                fi
            fi
        fi
        
        # Testar com terraform plan (mais rápido que apply)
        cd "$infra_dir"
        if terraform plan -out=tfplan-test -var="environment=$ENVIRONMENT" > /tmp/tf-plan-test.log 2>&1; then
            # Verificar se há erros de capacidade no log
            if ! grep -qi "SkuNotAvailable\|Capacity Restrictions" /tmp/tf-plan-test.log; then
                print_success "Configuração válida: $size (zona: ${zone:-auto})"
                rm -f "$tfvars_file.backup" /tmp/tf-plan-test.log tfplan-test
                cd "$PROJECT_ROOT"
                return 0
            fi
        fi
        
        # Restaurar backup
        mv "$tfvars_file.backup" "$tfvars_file"
        echo "❌"
        rm -f /tmp/tf-plan-test.log tfplan-test 2>/dev/null
    done
    
    cd "$PROJECT_ROOT"
    print_error "Nenhuma configuração de VM disponível na região atual"
    echo ""
    echo "💡 Opções:"
    echo "   1. Aguarde algumas horas e tente novamente (capacidade pode ser liberada)"
    echo "   2. Mude de região em infrastructure/terraform.tfvars:"
    echo "      location = \"eastus\"  # ou westus2, southcentralus"
    echo "   3. Use um tamanho maior manualmente em infrastructure/terraform.tfvars:"
    echo "      ollama_vm_size = \"Standard_D2s_v3\""
    echo "   4. Tente novamente mais tarde (capacidade muda constantemente)"
    exit 1
}

# Função auxiliar para atualizar configuração de VM
update_vm_config() {
    local size=$1
    local zone=$2
    local tfvars_file="$PROJECT_ROOT/infrastructure/terraform.tfvars"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/ollama_vm_size.*=.*/ollama_vm_size = \"$size\"/" "$tfvars_file"
        
        if [ "$zone" = "null" ]; then
            sed -i '' '/ollama_vm_zone/d' "$tfvars_file"
        else
            if grep -q "ollama_vm_zone" "$tfvars_file"; then
                sed -i '' "s/ollama_vm_zone.*=.*/ollama_vm_zone = $zone/" "$tfvars_file"
            else
                echo "ollama_vm_zone = $zone" >> "$tfvars_file"
            fi
        fi
    else
        sed -i "s/ollama_vm_size.*=.*/ollama_vm_size = \"$size\"/" "$tfvars_file"
        
        if [ "$zone" = "null" ]; then
            sed -i '/ollama_vm_zone/d' "$tfvars_file"
        else
            if grep -q "ollama_vm_zone" "$tfvars_file"; then
                sed -i "s/ollama_vm_zone.*=.*/ollama_vm_zone = $zone/" "$tfvars_file"
            else
                echo "ollama_vm_zone = $zone" >> "$tfvars_file"
            fi
        fi
    fi
}

# Tentar aplicar com retry automático em caso de erro de capacidade
try_apply_with_retry() {
    local infra_dir="$PROJECT_ROOT/infrastructure"
    local max_retries=5
    local retry_count=0
    
    # Configurações alternativas (em ordem de preferência)
    local fallback_configs=(
        "Standard_B1ms:1"
        "Standard_B1ms:2"
        "Standard_B1ms:3"
        "Standard_B2s:null"
        "Standard_B2s:1"
        "Standard_B2s:2"
        "Standard_B2s:3"
        "Standard_A1_v2:1"
        "Standard_A1_v2:2"
        "Standard_A1_v2:3"
        "Standard_A1_v2:null"
        "Standard_A2_v2:null"
        "Standard_A2_v2:1"
        "Standard_D2s_v3:null"
        "Standard_D2s_v3:1"
    )
    
    cd "$infra_dir"
    
    while [ $retry_count -lt $max_retries ] && [ $retry_count -lt ${#fallback_configs[@]} ]; do
        print_step "Tentativa $((retry_count + 1)): Aplicando mudanças..."
        
        # Fazer apply e capturar saída
        terraform apply -auto-approve tfplan > /tmp/tf-apply.log 2>&1
        local apply_exit_code=$?
        
        # Verificar se foi sucesso
        if [ $apply_exit_code -eq 0 ]; then
            print_success "Infraestrutura aplicada com sucesso!"
            rm -f /tmp/tf-apply.log
            cd "$PROJECT_ROOT"
            return 0
        fi
        
        # Verificar se o erro é de capacidade
        if grep -qi "SkuNotAvailable\|Capacity Restrictions" /tmp/tf-apply.log; then
            print_warning "Falha por falta de capacidade detectada"
            
            # Tentar próxima configuração
            local config="${fallback_configs[$retry_count]}"
            local size=$(echo $config | cut -d: -f1)
            local zone=$(echo $config | cut -d: -f2)
            
            print_step "Tentando configuração alternativa: $size (zona: ${zone:-auto})"
            
            # Atualizar configuração
            update_vm_config "$size" "$zone"
            
            # Fazer novo plan
            rm -f tfplan
            if terraform plan -out=tfplan -var="environment=$ENVIRONMENT" > /tmp/tf-plan-retry.log 2>&1; then
                if ! grep -qi "SkuNotAvailable\|Capacity Restrictions" /tmp/tf-plan-retry.log; then
                    retry_count=$((retry_count + 1))
                    rm -f /tmp/tf-plan-retry.log
                    continue
                fi
            fi
            rm -f /tmp/tf-plan-retry.log
        else
            # Erro não relacionado a capacidade
            print_error "Erro ao aplicar Terraform (não é problema de capacidade)"
            cat /tmp/tf-apply.log | tail -30
            rm -f /tmp/tf-apply.log
            cd "$PROJECT_ROOT"
            return 1
        fi
        
        retry_count=$((retry_count + 1))
        rm -f /tmp/tf-apply.log
    done
    
    print_error "Todas as tentativas falharam"
    cd "$PROJECT_ROOT"
    return 1
}

# Deploy da infraestrutura
deploy_infrastructure() {
    print_header "Deploy da Infraestrutura"
    
    local infra_dir="$PROJECT_ROOT/infrastructure"
    cd "$infra_dir"
    
    # Inicializar Terraform
    if [ ! -d ".terraform" ]; then
        print_step "Inicializando Terraform..."
        terraform init
    fi
    
    # Validar
    print_step "Validando configuração..."
    if ! terraform validate; then
        print_error "Validação do Terraform falhou"
        exit 1
    fi
    
    # Planejar
    print_step "Planejando mudanças..."
    if ! terraform plan -out=tfplan -var="environment=$ENVIRONMENT"; then
        print_error "Planejamento do Terraform falhou"
        exit 1
    fi
    
    # Aplicar
    echo ""
    read -p "🤔 Deseja aplicar as mudanças na infraestrutura? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Tentar apply com retry automático
        if ! try_apply_with_retry; then
            print_error "Falha ao fazer deploy da infraestrutura"
            echo ""
            echo "💡 Opções:"
            echo "   1. Aguarde algumas horas e tente novamente"
            echo "   2. Mude de região em infrastructure/terraform.tfvars"
            echo "   3. Use um tamanho maior manualmente"
            exit 1
        fi
        
        print_success "Infraestrutura deployada"
        
        # Obter outputs
        OLLAMA_PUBLIC_IP=$(terraform output -raw ollama_vm_public_ip 2>/dev/null || echo "")
        OLLAMA_PRIVATE_IP=$(terraform output -raw ollama_vm_private_ip 2>/dev/null || echo "")
        OLLAMA_USE_PUBLIC_IP=$(terraform output -raw ollama_use_public_ip 2>/dev/null || echo "false")
        BACKEND_APP_NAME=$(terraform output -raw backend_app_service_name 2>/dev/null || terraform output -raw backend_app_name 2>/dev/null || echo "app-fratelli-backend-$ENVIRONMENT")
        RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "rg-fratelli-$ENVIRONMENT")
        
        if [ -n "$OLLAMA_PUBLIC_IP" ] || [ -n "$OLLAMA_PRIVATE_IP" ]; then
            if [ "$OLLAMA_USE_PUBLIC_IP" = "true" ] && [ -n "$OLLAMA_PUBLIC_IP" ]; then
                OLLAMA_URL="http://${OLLAMA_PUBLIC_IP}:11434"
            elif [ -n "$OLLAMA_PRIVATE_IP" ]; then
                OLLAMA_URL="http://${OLLAMA_PRIVATE_IP}:11434"
            fi
            print_success "Ollama VM criada"
            echo "   URL: $OLLAMA_URL"
            echo "   Aguarde alguns minutos para inicialização..."
        fi
    else
        print_warning "Deploy da infraestrutura cancelado"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Build e deploy do backend
deploy_backend() {
    print_header "Build e Deploy do Backend"
    
    local backend_dir="$PROJECT_ROOT/backend"
    cd "$backend_dir"
    
    # Obter variáveis da infraestrutura se não foram definidas (via deploy_infrastructure)
    local infra_dir="$PROJECT_ROOT/infrastructure"
    if [ -z "$RESOURCE_GROUP" ] || [ -z "$BACKEND_APP_NAME" ]; then
        print_step "Obtendo informações do App Service via Terraform..."
        if [ -d "$infra_dir" ] && [ -d "$infra_dir/.terraform" ]; then
            cd "$infra_dir"
            RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "rg-fratelli-$ENVIRONMENT")
            BACKEND_APP_NAME=$(terraform output -raw backend_app_service_name 2>/dev/null || terraform output -raw backend_app_name 2>/dev/null || echo "")
            cd "$backend_dir"
        else
            RESOURCE_GROUP="rg-fratelli-$ENVIRONMENT"
            BACKEND_APP_NAME=""
        fi
    fi
    
    # Instalar dependências
    print_step "Instalando dependências..."
    npm install
    
    # Build
    print_step "Fazendo build..."
    npm run build
    
    print_success "Backend buildado"
    
    # Deploy
    echo ""
    read -p "🤔 Deseja fazer deploy do backend? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Criando pacote de deploy..."
        
        # Criar diretório temporário para o pacote
        local temp_dir=$(mktemp -d)
        local deploy_dir="$temp_dir/deploy"
        mkdir -p "$deploy_dir"
        
        # Copiar arquivos necessários para o diretório raiz do deploy (não dentro de subdiretório)
        cp -r dist/ "$deploy_dir/"
        cp package.json "$deploy_dir/"
        cp package-lock.json "$deploy_dir/" 2>/dev/null || true
        cp -r prisma/ "$deploy_dir/" 2>/dev/null || true
        
        # Copiar startup.sh se existir
        if [ -f startup.sh ]; then
            cp startup.sh "$deploy_dir/"
            chmod +x "$deploy_dir/startup.sh"
        fi
        
        # Criar ZIP - o conteúdo deve estar na raiz do ZIP (não dentro de uma pasta deploy/)
        cd "$deploy_dir"
        zip -r "$temp_dir/deploy.zip" . -x "*.map" "*.test.*" "*.log" "node_modules/*" > /dev/null 2>&1
        cd "$backend_dir"
        
        print_step "Fazendo deploy no Azure App Service..."
        local zip_size=$(du -h "$temp_dir/deploy.zip" | cut -f1)
        echo "   Tamanho do pacote: $zip_size"
        
        # Obter variáveis da infraestrutura se não foram passadas
        local infra_dir="$PROJECT_ROOT/infrastructure"
        if [ -z "$RESOURCE_GROUP" ] || [ -z "$BACKEND_APP_NAME" ]; then
            print_step "Obtendo informações do App Service via Terraform..."
            if [ -d "$infra_dir" ] && [ -d "$infra_dir/.terraform" ]; then
                cd "$infra_dir"
                RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "rg-fratelli-$ENVIRONMENT")
                BACKEND_APP_NAME=$(terraform output -raw backend_app_service_name 2>/dev/null || terraform output -raw backend_app_name 2>/dev/null || echo "")
                cd "$backend_dir"
            else
                RESOURCE_GROUP="rg-fratelli-$ENVIRONMENT"
                BACKEND_APP_NAME=""
            fi
        fi
        
        # Tentar encontrar App Service se não foi encontrado via Terraform
        if [ -z "$BACKEND_APP_NAME" ] || [ "$BACKEND_APP_NAME" = "null" ]; then
            print_step "Procurando App Service no resource group '$RESOURCE_GROUP'..."
            BACKEND_APP_NAME=$(az webapp list \
                --resource-group "$RESOURCE_GROUP" \
                --query "[?contains(name, 'backend') || contains(name, 'app')].name" -o tsv 2>/dev/null | head -1)
        fi
        
        # Verificar se encontrou o App Service
        if [ -z "$BACKEND_APP_NAME" ] || [ "$BACKEND_APP_NAME" = "null" ]; then
            print_error "App Service não encontrado no resource group '$RESOURCE_GROUP'"
            echo ""
            echo "📋 Soluções:"
            echo "   1. Faça deploy da infraestrutura primeiro"
            echo "   2. Verifique se o App Service existe:"
            echo "      az webapp list --resource-group $RESOURCE_GROUP -o table"
            echo "   3. Verifique se o Terraform foi aplicado com sucesso"
            rm -rf "$temp_dir"
            cd "$backend_dir"
            exit 1
        fi
        
        # Verificar se o App Service realmente existe no Azure
        print_step "Verificando App Service: $BACKEND_APP_NAME"
        if ! az webapp show --resource-group "$RESOURCE_GROUP" --name "$BACKEND_APP_NAME" > /dev/null 2>&1; then
            print_error "App Service '$BACKEND_APP_NAME' não existe ou não está acessível no Azure"
            echo ""
            echo "📋 Verifique:"
            echo "   - App Service foi criado: az webapp list --resource-group $RESOURCE_GROUP -o table"
            echo "   - Você tem permissões para acessar o resource group"
            echo "   - Resource group está correto: $RESOURCE_GROUP"
            rm -rf "$temp_dir"
            cd "$backend_dir"
            exit 1
        fi
        
        # Obter credenciais e URL do SCM (Kudu API)
        print_step "Obtendo URL do SCM..."
        local scm_url=$(az webapp show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$BACKEND_APP_NAME" \
            --query scmSiteUrl -o tsv 2>/dev/null)
        
        if [ -z "$scm_url" ]; then
            print_error "Não foi possível obter URL do SCM do App Service"
            echo ""
            echo "📋 Possíveis causas:"
            echo "   - App Service ainda está sendo criado (aguarde alguns minutos)"
            echo "   - Problemas de permissão"
            echo "   - App Service está em um estado incorreto"
            echo ""
            echo "   Verifique o status:"
            echo "   az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query state"
            rm -rf "$temp_dir"
            cd "$backend_dir"
            exit 1
        fi
        
        print_success "URL do SCM obtida: $scm_url"
        
        local username=$(az webapp deployment list-publishing-profiles \
            --resource-group "$RESOURCE_GROUP" \
            --name "$BACKEND_APP_NAME" \
            --query "[0].userName" -o tsv 2>/dev/null)
        local password=$(az webapp deployment list-publishing-profiles \
            --resource-group "$RESOURCE_GROUP" \
            --name "$BACKEND_APP_NAME" \
            --query "[0].userPWD" -o tsv 2>/dev/null)
        
        if [ -z "$username" ] || [ -z "$password" ]; then
            print_error "Não foi possível obter credenciais de deploy"
            rm -rf "$temp_dir"
            cd "$backend_dir"
            exit 1
        fi
        
        # Usar Kudu API (método mais confiável e direto)
        print_step "Enviando pacote via Kudu API..."
        
        # Fazer upload do ZIP via Kudu
        local http_code=$(curl -X POST \
            -u "$username:$password" \
            --data-binary @"$temp_dir/deploy.zip" \
            "$scm_url/api/zipdeploy?isAsync=false" \
            -H "Content-Type: application/octet-stream" \
            --progress-bar \
            --write-out "%{http_code}" \
            --silent \
            --output /tmp/kudu-response.json 2>&1)
        
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            print_success "Deploy concluído via Kudu API (Status: $http_code)"
        else
            print_error "Kudu API retornou status $http_code"
            
            # Mostrar resposta de erro
            if [ -f /tmp/kudu-response.json ]; then
                echo ""
                echo "   Resposta do servidor:"
                cat /tmp/kudu-response.json | head -20 | sed 's/^/   /'
                echo ""
            fi
            
            # Tentar método alternativo
            print_warning "Tentando método alternativo (az webapp deploy)..."
            if az webapp deploy \
                --resource-group "$RESOURCE_GROUP" \
                --name "$BACKEND_APP_NAME" \
                --src-path "$temp_dir/deploy.zip" \
                --type zip \
                --async false \
                --timeout 300 \
                --output none 2>&1; then
                print_success "Deploy concluído via az webapp deploy"
            else
                print_error "Falha em ambos os métodos de deploy"
                echo ""
                echo "📋 Verifique:"
                echo "   1. App Service existe:"
                echo "      az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP"
                echo ""
                echo "   2. Tamanho do ZIP: $zip_size (máximo recomendado: 100MB)"
                echo ""
                echo "   3. Estrutura do ZIP está correta (deve conter dist/, package.json, prisma/)"
                echo ""
                echo "   4. Configure o comando de startup no App Service:"
                echo "      az webapp config set --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --startup-file \"node dist/server.js\""
                rm -rf "$temp_dir" /tmp/kudu-response.json
                cd "$backend_dir"
                exit 1
            fi
        fi
        
        rm -f /tmp/kudu-response.json
        
        # Limpar
        cd "$backend_dir"
        rm -rf "$temp_dir"
        
        # Configurar variáveis de ambiente do Ollama
        if [ -n "$OLLAMA_URL" ]; then
            print_step "Configurando variáveis de ambiente do Ollama..."
            az webapp config appsettings set \
                --resource-group "$RESOURCE_GROUP" \
                --name "$BACKEND_APP_NAME" \
                --settings \
                    USE_OLLAMA=true \
                    OLLAMA_BASE_URL="$OLLAMA_URL" \
                    OLLAMA_MODEL=llama3.2 \
                --output none
            
            print_success "Variáveis de ambiente configuradas"
        fi
        
        print_success "Backend deployado"
        local backend_url=$(az webapp show --resource-group "$RESOURCE_GROUP" --name "$BACKEND_APP_NAME" --query defaultHostName -o tsv 2>/dev/null || echo "N/A")
        echo "   URL: https://$backend_url"
    else
        print_warning "Deploy do backend cancelado"
    fi
    
    cd "$PROJECT_ROOT"
}

# Build e deploy do frontend
deploy_frontend() {
    print_header "Build e Deploy do Frontend"
    
    local frontend_dir="$PROJECT_ROOT/frontend"
    cd "$frontend_dir"
    
    # Instalar dependências
    print_step "Instalando dependências..."
    npm install
    
    # Build
    print_step "Fazendo build..."
    npm run build
    
    print_success "Frontend buildado"
    
    # Deploy
    echo ""
    read -p "🤔 Deseja fazer deploy do frontend? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v vercel &> /dev/null; then
            print_step "Fazendo deploy na Vercel..."
            vercel --prod
            print_success "Frontend deployado na Vercel"
        else
            print_warning "Vercel CLI não instalado"
            echo "   Instale com: npm i -g vercel"
            echo "   Ou faça deploy manual via GitHub/Vercel dashboard"
        fi
    else
        print_warning "Deploy do frontend cancelado"
    fi
    
    cd "$PROJECT_ROOT"
}

# Resumo final
show_summary() {
    print_header "Deploy Concluído!"
    
    echo "📊 Resumo:"
    echo ""
    
    if [ -n "$OLLAMA_URL" ]; then
        echo "   Ollama VM: $OLLAMA_URL"
    fi
    
    if [ -n "$BACKEND_APP_NAME" ]; then
        local backend_url=$(az webapp show --resource-group "$RESOURCE_GROUP" --name "$BACKEND_APP_NAME" --query defaultHostName -o tsv 2>/dev/null || echo "N/A")
        echo "   Backend: https://$backend_url"
    fi
    
    echo ""
    echo "🔧 Próximos passos:"
    echo "   1. Verifique os logs do backend:"
    echo "      az webapp log tail --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP"
    echo ""
    echo "   2. Teste a geração de receitas via IA"
    echo ""
    echo "   3. Configure monitoramento e alertas"
    echo ""
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main() {
    print_header "🚀 Deploy Completo - Fratelli"
    echo "Ambiente: $ENVIRONMENT"
    echo ""
    
    # Verificações iniciais
    check_prerequisites
    check_azure_auth
    setup_ssh_key
    
    # Detectar capacidade de VM
    detect_vm_capacity
    
    # Deploys
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    
    # Resumo
    show_summary
}

# Executar
main

