# 🚀 Infraestrutura Minimalista - Fratelli

Infraestrutura simplificada e econômica para hospedar apenas o **banco de dados PostgreSQL** e o **backend** no Azure.

## 📋 O que é criado

Esta infraestrutura cria apenas o essencial:

- ✅ **PostgreSQL Flexible Server** - Banco de dados (B_Standard_B1ms - econômico)
- ✅ **App Service (Linux)** - Backend Node.js (B1 - Basic tier, mais barato)
- ✅ **Key Vault** - Armazenamento seguro de secrets
- ✅ **Resource Group** - Grupo de recursos

**Total estimado: ~$30-50/mês** (dependendo do uso)

## 🚀 Setup Automático

### Pré-requisitos

1. **Azure CLI instalado**: [Instalar Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
2. **Terraform instalado**: [Instalar Terraform](https://www.terraform.io/downloads)
3. **Login no Azure**: `az login`

### Executar Setup

```bash
cd infrastructure
./setup.sh
```

O script irá:
- ✅ Verificar autenticação Azure
- ✅ Ler configurações do `terraform.tfvars`
- ✅ Inicializar Terraform
- ✅ Validar configuração
- ✅ Mostrar plano de execução
- ✅ Aplicar mudanças
- ✅ Mostrar informações da infraestrutura criada

## ⚙️ Configuração

Edite o arquivo `terraform.tfvars` com suas configurações:

```hcl
project_name = "fratelli"
environment  = "dev"
location     = "brazilsouth"

# Credenciais Azure
subscription_id = "seu-subscription-id"
tenant_id       = "seu-tenant-id"

# PostgreSQL
postgres_admin_login    = "postgresadmin"
postgres_admin_password = "SuaSenhaSegura123!"
postgres_sku_name       = "B_Standard_B1ms" # Econômico para dev
```

## 📊 Outputs

Após o setup, você terá acesso a:

- **PostgreSQL Server FQDN**: Para conexão do banco
- **Backend App Service URL**: URL do backend hospedado
- **Key Vault URI**: Para acessar secrets (DATABASE_URL)
- **Resource Group**: Nome do grupo de recursos

## 💰 Custos

### Estimativa mensal (dev):

- **PostgreSQL B_Standard_B1ms**: ~$15-20/mês
- **App Service B1 (Basic)**: ~$13-15/mês
- **Key Vault Standard**: ~$0.03/10k operações (praticamente grátis)
- **Storage (backup PostgreSQL)**: ~$2-5/mês

**Total: ~$30-40/mês** para ambiente de desenvolvimento

## 🔧 Deploy do Backend

Após o setup, faça deploy do backend:

```bash
# Obter informações
cd infrastructure
terraform output backend_app_service_url

# Deploy (exemplo com Azure CLI)
az webapp deploy \
    --resource-group $(terraform output -raw resource_group_name) \
    --name $(terraform output -raw backend_app_service_name) \
    --src-path ../backend/dist.zip \
    --type zip
```

## 🔐 Acessar DATABASE_URL

A `DATABASE_URL` está armazenada no Key Vault:

```bash
# Via Azure CLI
az keyvault secret show \
    --vault-name $(terraform output -raw key_vault_name) \
    --name database-url \
    --query value -o tsv

# Ou configure no App Service
az webapp config appsettings set \
    --resource-group $(terraform output -raw resource_group_name) \
    --name $(terraform output -raw backend_app_service_name) \
    --settings DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://$(terraform output -raw key_vault_name).vault.azure.net/secrets/database-url/)"
```

## 🗑️ Remover Infraestrutura

Para remover tudo:

```bash
cd infrastructure
terraform destroy -auto-approve
```

## 📝 Estrutura de Arquivos

```
infrastructure/
├── main.tf              # Configuração principal (tudo em um arquivo)
├── variables.tf         # Variáveis
├── outputs.tf          # Outputs
├── terraform.tfvars    # Configurações (NÃO commitar)
├── setup.sh            # Script de setup automático
└── README.md           # Este arquivo
```

## ⚠️ Importante

- **NUNCA** commite o arquivo `terraform.tfvars` (contém senhas)
- O arquivo está no `.gitignore`
- Monitore os custos no Azure Portal
- Para produção, considere usar SKUs maiores

## 🆘 Troubleshooting

### Erro de autenticação
```bash
az login
az account set --subscription "seu-subscription-id"
```

### Ver logs do backend
```bash
az webapp log tail \
    --resource-group $(terraform output -raw resource_group_name) \
    --name $(terraform output -raw backend_app_service_name)
```

### Verificar status dos recursos
```bash
az resource list --resource-group $(terraform output -raw resource_group_name) -o table
```
