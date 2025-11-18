# SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = "sql-${var.project_name}-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"

  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = data.azurerm_client_config.current.object_id
  }

  tags = var.common_tags
}

# Firewall Rule - Permitir serviços Azure
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = "sqldb-${var.project_name}-${var.environment}"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  max_size_gb    = 32
  sku_name       = var.sql_sku_name
  zone_redundant = var.environment == "production"

  # Auto-pause delay (apenas para Serverless)
  auto_pause_delay_in_minutes = var.environment == "dev" ? 60 : -1

  tags = var.common_tags
}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${var.project_name}-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  tags = var.common_tags
}

# Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "cosmosdb-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Cosmos DB Container (para produtos)
resource "azurerm_cosmosdb_sql_container" "products" {
  name                  = "products"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_paths   = ["/id"]
  partition_key_version = 1

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }
  }
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  count               = var.enable_redis ? 1 : 0
  name                = "redis-${var.project_name}-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.environment == "production" ? 1 : 0 # 0 = Basic C0, 1 = Standard C1
  family              = "C"
  sku_name            = var.environment == "production" ? "Standard" : "Basic"
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_reserved = 2
    maxmemory_delta    = 2
    maxmemory_policy   = "allkeys-lru"
  }

  tags = var.common_tags
}

# Obter configuração do cliente atual
data "azurerm_client_config" "current" {}

# Access Policy para Key Vault (necessário para adicionar secrets)
# Nota: Esta política pode conflitar com a do módulo de segurança, mas é necessária
# para garantir que os secrets possam ser criados
/* Removido para evitar conflito de duplicidade com módulo security */

# Armazenar credenciais no Key Vault
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "sql-connection-string"
  value        = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  key_vault_id = var.key_vault_id

  # Garante que a policy do módulo de segurança exista antes de criar o secret
  # (a dependência entre módulos será reforçada no main.tf raiz)
  depends_on = []
}

resource "azurerm_key_vault_secret" "cosmos_connection_string" {
  name         = "cosmos-connection-string"
  value        = azurerm_cosmosdb_account.main.connection_strings[0]
  key_vault_id = var.key_vault_id

  depends_on = []
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  count        = var.enable_redis ? 1 : 0
  name         = "redis-connection-string"
  value        = azurerm_redis_cache.main[0].primary_connection_string
  key_vault_id = var.key_vault_id

  depends_on = []
}

