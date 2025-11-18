# 🚀 Infraestrutura Azure - Guia de Deploy

Este guia foi criado para facilitar o deploy da infraestrutura no Azure, mesmo para equipes não técnicas.

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

1. **Conta Azure** com permissões de administrador
2. **Azure CLI** instalado ([Instalar Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli))
3. **Terraform** instalado ([Instalar Terraform](https://www.terraform.io/downloads))
4. **kubectl** instalado (para gerenciar o AKS) ([Instalar kubectl](https://kubernetes.io/docs/tasks/tools/))

## 🎯 Passo a Passo Rápido

### 1. Login no Azure

```bash
az login
```

### 2. Configurar Variáveis

Copie o arquivo de exemplo e preencha com suas informações:

```bash
cp terraform.tfvars.example terraform.tfvars
```

**📖 Precisa obter suas credenciais Azure?** Consulte o guia: [COMO_OBTER_CREDENCIAIS.md](COMO_OBTER_CREDENCIAIS.md)

**Resumo rápido:**
```bash
# Fazer login
az login

# Obter Subscription ID
az account show --query id -o tsv

# Obter Tenant ID
az account show --query tenantId -o tsv
```

Edite o arquivo `terraform.tfvars` com suas configurações.

### 3. Deploy Automático

Execute o script de deploy:

```bash
./scripts/deploy.sh
```

Isso irá:
- ✅ Criar o grupo de recursos
- ✅ Configurar todos os serviços Azure
- ✅ Aplicar configurações de segurança
- ✅ Configurar escalabilidade automática
- ✅ Aplicar tags de governança

### 4. Remover Infraestrutura

Para remover tudo quando não precisar mais:

```bash
./scripts/destroy.sh
```

## 📁 Estrutura de Arquivos

```
infrastructure/
├── README.md                 # Este arquivo
├── main.tf                   # Configuração principal
├── variables.tf              # Definição de variáveis
├── outputs.tf                # Saídas do Terraform
├── terraform.tfvars.example  # Exemplo de configuração
├── modules/                  # Módulos Terraform
│   ├── frontend/            # Camada de apresentação
│   ├── backend/             # Camada de lógica de negócios
│   ├── data/                # Camada de dados
│   ├── security/            # Configurações de segurança
│   └── networking/          # Rede e Application Gateway
└── scripts/                  # Scripts de automação
    ├── deploy.sh            # Script de deploy
    ├── destroy.sh           # Script de remoção
    └── validate.sh          # Validação de configuração
```

## 🔧 Configuração Detalhada

### Variáveis Principais

No arquivo `terraform.tfvars`, você precisa configurar:

- **project_name**: Nome do projeto (ex: "fratelli")
- **environment**: Ambiente (dev, staging, production)
- **location**: Região do Azure (ex: "brazilsouth")
- **subscription_id**: ID da sua assinatura Azure
- **tenant_id**: ID do seu tenant Azure AD

### Serviços Criados

A infraestrutura cria automaticamente:

#### 🎨 Camada de Apresentação
- Azure App Service (Frontend)
- Application Gateway com WAF

#### ⚙️ Camada de Lógica
- Azure Kubernetes Service (AKS)
- Azure Functions

#### 💾 Camada de Dados
- Azure SQL Database
- Azure Cosmos DB
- Azure Cache for Redis

#### 🛡️ Segurança
- Azure Key Vault
- Microsoft Defender for Cloud
- Azure AD B2C (configuração manual necessária)

## 📊 Monitoramento e Custos

Após o deploy, você pode:

1. **Monitorar custos**: Acesse o Azure Portal → Cost Management
2. **Ver recomendações**: Azure Portal → Advisor
3. **Monitorar segurança**: Azure Portal → Defender for Cloud

## ⚠️ Importante

- **Custos**: Esta infraestrutura gera custos no Azure. Monitore regularmente.
- **Backup**: Configure backups dos bancos de dados após o deploy.
- **Domínio**: Configure seu domínio personalizado após o deploy inicial.

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs: `terraform plan` e `terraform apply`
2. Consulte a documentação do Azure
3. Verifique se todas as variáveis estão preenchidas corretamente

## 📝 Próximos Passos

Após o deploy bem-sucedido:

1. Configure o Azure AD B2C manualmente no portal
2. Configure domínios personalizados
3. Configure alertas de custo no Azure Cost Management
4. Configure backups automáticos dos bancos de dados

