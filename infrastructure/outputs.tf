output "resource_group_name" {
  description = "Nome do grupo de recursos criado"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Localização do grupo de recursos"
  value       = azurerm_resource_group.main.location
}

# Database
output "postgres_server_fqdn" {
  description = "FQDN do PostgreSQL Server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_database_name" {
  description = "Nome do banco de dados PostgreSQL (padrão: postgres)"
  value       = "postgres"
}

output "database_url" {
  description = "URL de conexão do banco de dados (DATABASE_URL) - Sensível"
  value       = "postgresql://${var.postgres_admin_login}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/postgres?sslmode=require"
  sensitive   = true
}

# Backend
output "backend_app_service_name" {
  description = "Nome do App Service (Backend)"
  value       = azurerm_linux_web_app.backend.name
}

output "backend_app_name" {
  description = "Nome do App Service (Backend) - alias"
  value       = azurerm_linux_web_app.backend.name
}

output "backend_app_service_url" {
  description = "URL do App Service (Backend)"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

# Security
output "key_vault_name" {
  description = "Nome do Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI do Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}
