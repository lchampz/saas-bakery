# 🚀 Guia de Deploy - Infraestrutura Azure

Este guia explica como fazer deploy da infraestrutura completa no Azure, incluindo a VM Ollama.

## 📋 Pré-requisitos

1. **Azure CLI instalado e autenticado**
   ```bash
   # Verificar se está instalado
   az --version
   
   # Fazer login (se necessário)
   az logout
   az login
   
   # Verificar subscription ativa
   az account show
   ```

2. **Terraform instalado** (>= 1.0)
   ```bash
   terraform --version
   ```

3. **Chave SSH gerada**
   ```bash
   # Verificar se já existe
   ls -la ~/.ssh/id_rsa.pub
   
   # Se não existir, gerar
   ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"
   ```

## 🔧 Configuração Inicial

### 1. Configurar Variáveis do Terraform

Edite `terraform.tfvars`:

```hcl
project_name = "fratelli"
environment  = "production"
location     = "brazilsouth"

# Credenciais Azure (obter via: az account show)
subscription_id = "sua-subscription-id"
tenant_id       = "seu-tenant-id"

# PostgreSQL
postgres_admin_login    = "postgresadmin"
postgres_admin_password = "SuaSenhaForte123!"

# Ollama VM
ollama_vm_ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E..." # Conteúdo de ~/.ssh/id_rsa.pub
ollama_model            = "llama3.2"
```

### 2. Obter Chave SSH Pública

```bash
cat ~/.ssh/id_rsa.pub
# Copie o conteúdo completo e cole em terraform.tfvars
```

## 🚀 Deploy

### Opção 1: Script Automatizado (Recomendado)

```bash
# Do diretório raiz do projeto
./deploy-production.sh
```

### Opção 2: Deploy Manual Passo a Passo

#### 1. Autenticar no Azure

```bash
az logout
az login
az account set --subscription "SUA_SUBSCRIPTION_ID"
```

#### 2. Deploy da Infraestrutura Base

```bash
cd infrastructure
terraform init
terraform plan -var="environment=production"
terraform apply
```

#### 3. Deploy da VM Ollama

```bash
cd infrastructure
./deploy-ollama.sh production
```

#### 4. Verificar Ollama

```bash
./check-ollama.sh <IP_DA_VM>
```

#### 5. Configurar Backend

```bash
# Obter IP da VM
OLLAMA_IP=$(terraform output -raw ollama_vm_public_ip)

# Configurar variáveis de ambiente
az webapp config appsettings set \
  --resource-group rg-fratelli-production \
  --name app-fratelli-backend-production \
  --settings \
    USE_OLLAMA=true \
    OLLAMA_BASE_URL="http://${OLLAMA_IP}:11434" \
    OLLAMA_MODEL=llama3.2
```

## 🔍 Troubleshooting

### Erro: Token do Azure expirado

```bash
# Solução
az logout
az login
```

### Erro: Terraform não encontra recursos

```bash
# Verificar se está na subscription correta
az account show

# Se necessário, mudar subscription
az account set --subscription "SUA_SUBSCRIPTION_ID"
```

### Erro: Chave SSH inválida

```bash
# Verificar formato da chave
cat ~/.ssh/id_rsa.pub

# Deve começar com: ssh-rsa AAAAB3NzaC1yc2E...
```

### Erro: VNet já existe

Se você já tem uma VNet e quer usar ela:

1. Edite `terraform.tfvars`:
   ```hcl
   create_vnet_for_ollama = false
   existing_vnet_name     = "sua-vnet-existente"
   ```

2. Ajuste o `address_prefixes` da subnet se necessário

## 📊 Verificar Deploy

### Listar Recursos Criados

```bash
cd infrastructure
terraform output
```

### Verificar Status da VM

```bash
az vm show \
  --name vm-ollama-production \
  --resource-group rg-fratelli-production \
  --query "powerState" -o tsv
```

### Verificar Logs do Backend

```bash
az webapp log tail \
  --name app-fratelli-backend-production \
  --resource-group rg-fratelli-production
```

## 🔄 Atualizações

### Atualizar Infraestrutura

```bash
cd infrastructure
terraform plan
terraform apply
```

### Destruir Recursos (CUIDADO!)

```bash
cd infrastructure
terraform destroy
```

## 💰 Custos

Estimativa mensal (Brasil Sul):
- VM Ollama (B2s): ~R$ 150-200
- Backend App Service (B1): ~R$ 50-80
- PostgreSQL (B1ms): ~R$ 100-150
- IP Público: ~R$ 5
- **Total**: ~R$ 305-435/mês

## 📚 Documentação Adicional

- [Deploy Ollama](./DEPLOY_OLLAMA.md)
- [README Principal](../README_DEPLOY.md)

