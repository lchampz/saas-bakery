terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }

  # Backend remoto desabilitado por padrão
  # Para usar backend remoto no Azure Storage, descomente e configure:
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "stterraformstate"
  #   container_name       = "tfstate"
  #   key                  = "fratelli.terraform.tfstate"
  #   # Usa autenticação Azure AD automaticamente (az login)
  # }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

# Grupo de Recursos Principal
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location

  tags = local.common_tags
}

# Módulo de Rede (omitido em economy_mode)
module "networking" {
  source = "./modules/networking"
  count  = var.economy_mode ? 0 : 1

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  common_tags         = local.common_tags
}

# Módulo de Segurança
module "security" {
  source = "./modules/security"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  common_tags         = local.common_tags
}

# Módulo de Dados
module "data" {
  source = "./modules/data"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  common_tags         = local.common_tags

  key_vault_id = module.security.key_vault_id

  # Configurações de banco de dados
  sql_admin_login    = var.sql_admin_login
  sql_admin_password = var.sql_admin_password
  sql_sku_name       = var.economy_mode ? "S0" : var.sql_sku_name
  enable_redis       = var.economy_mode ? false : true

  # Cosmos DB
  cosmos_db_throughput     = var.cosmos_db_throughput
  cosmos_db_max_throughput = var.cosmos_db_max_throughput

  # Garante que políticas de acesso do Key Vault existam antes de criar secrets
  depends_on = [module.security]
}

# Módulo de Backend (AKS e Functions)
module "backend" {
  source = "./modules/backend"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  common_tags         = local.common_tags

  vnet_id      = var.economy_mode ? null : module.networking[0].vnet_id
  subnet_id    = var.economy_mode ? null : module.networking[0].aks_subnet_id
  key_vault_id = module.security.key_vault_id

  # AKS Configuration
  aks_node_count     = var.aks_node_count
  aks_vm_size        = var.aks_vm_size
  aks_min_node_count = var.aks_min_node_count
  aks_max_node_count = var.aks_max_node_count
  enable_aks         = var.economy_mode ? false : true
}

# Módulo de Frontend
module "frontend" {
  source = "./modules/frontend"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  common_tags         = local.common_tags

  app_gateway_id = var.economy_mode ? null : module.networking[0].app_gateway_id
  key_vault_id   = module.security.key_vault_id
}

# Local values para tags comuns
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }
}

