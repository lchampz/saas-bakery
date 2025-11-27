terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# Grupo de Recursos Principal
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location

  tags = local.common_tags
}

# Key Vault (mínimo - apenas para secrets)
resource "azurerm_key_vault" "main" {
  # Key Vault names must be 3-24 chars, alphanumeric and dashes only, globally unique
  # Format: kv{proj}{env}{hash} (max 24 chars: kv=2 + proj=6 + env=3 + hash=8 = 19 chars)
  name                       = "kv${substr(replace("${var.project_name}", "-", ""), 0, 6)}${substr(var.environment, 0, 3)}${substr(md5(azurerm_resource_group.main.name), 0, 8)}"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7 # Valor fixo - não pode ser modificado após criação

  # Access policy para o usuário atual
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover",
      "Backup",
      "Restore",
      "Purge"
    ]
  }

  # Ignorar mudanças em tags para evitar conflitos
  lifecycle {
    ignore_changes = [tags]
  }

  tags = local.common_tags
}

# Obter configuração do cliente atual (deve vir antes do Key Vault)
data "azurerm_client_config" "current" {}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "postgres-${var.project_name}-${var.environment}-${substr(md5(azurerm_resource_group.main.name), 0, 8)}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = var.location
  version                = "16"
  administrator_login    = var.postgres_admin_login
  administrator_password = var.postgres_admin_password
  sku_name               = var.postgres_sku_name
  storage_mb             = 32768 # 32GB mínimo
  backup_retention_days  = 7     # Reduzir para 7 dias (mínimo) para economizar

  # Configuração de alta disponibilidade (apenas produção com SKU General Purpose)
  # Nota: Alta disponibilidade requer SKU mínimo GP_Standard_D2s_v3 e não está disponível para SKUs Burstable (B_Standard_*)
  # SKUs Burstable (B_Standard_*) não suportam alta disponibilidade
  dynamic "high_availability" {
    for_each = var.environment == "production" && can(regex("^GP_Standard", var.postgres_sku_name)) ? [1] : []
    content {
      mode = "ZoneRedundant"
      # Zona 1 é geralmente a mais disponível em brazilsouth
      standby_availability_zone = 1
    }
  }

  # Configuração de rede - permitir acesso público
  public_network_access_enabled = true

  # Configuração de manutenção
  maintenance_window {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  # Ignorar mudanças em tags e zone para evitar conflitos
  lifecycle {
    ignore_changes = [tags, zone]
  }

  tags = local.common_tags
}

# Firewall Rule - Permitir serviços Azure
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# PostgreSQL Database
# Nota: No PostgreSQL Flexible Server, os bancos são criados via SQL
# O banco padrão 'postgres' já existe. Criaremos 'fratelli_db' via script ou manualmente
# Por enquanto, usaremos o banco padrão 'postgres' na connection string

# Secret com DATABASE_URL no Key Vault
# Aguardar alguns segundos após criar o Key Vault para garantir que as políticas estejam ativas
resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = "postgresql://${var.postgres_admin_login}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/postgres?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault.main,
    azurerm_postgresql_flexible_server.main
  ]
}

# App Service Plan (Linux - mais barato)
resource "azurerm_service_plan" "backend" {
  name                = "asp-${var.project_name}-backend-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1" # B1 é o mais barato (Basic tier)

  tags = local.common_tags
}

# App Service para Backend
resource "azurerm_linux_web_app" "backend" {
  name                = "app-${var.project_name}-backend-${var.environment}-${substr(md5(azurerm_resource_group.main.name), 0, 8)}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.backend.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }

    always_on = false # B1 não suporta always_on, mas é mais barato
  }

  # App Settings
  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~20"
    "NODE_ENV"                       = var.environment
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

# Role Assignment para App Service acessar Key Vault
resource "azurerm_role_assignment" "backend_keyvault" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.backend.identity[0].principal_id
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
