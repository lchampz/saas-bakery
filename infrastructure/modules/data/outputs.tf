output "redis_cache_hostname" {
  description = "Hostname do Redis Cache (pode ser vazio em economy_mode)"
  value       = var.enable_redis && length(azurerm_redis_cache.main) > 0 ? azurerm_redis_cache.main[0].hostname : ""
}
output "sql_server_fqdn" {
  description = "FQDN do SQL Server"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Nome do banco de dados SQL"
  value       = azurerm_mssql_database.main.name
}

output "cosmos_db_account_name" {
  description = "Nome da conta do Cosmos DB"
  value       = azurerm_cosmosdb_account.main.name
}

output "cosmos_db_endpoint" {
  description = "Endpoint do Cosmos DB"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "redis_cache_hostname" {
  description = "Hostname do Redis Cache"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_cache_port" {
  description = "Porta do Redis Cache"
  value       = azurerm_redis_cache.main.port
}

