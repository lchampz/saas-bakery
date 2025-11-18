output "resource_group_name" {
  description = "Nome do grupo de recursos criado"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Localização do grupo de recursos"
  value       = azurerm_resource_group.main.location
}

# Frontend
output "app_service_name" {
  description = "Nome do App Service (Frontend)"
  value       = module.frontend.app_service_name
}

output "app_service_url" {
  description = "URL do App Service"
  value       = module.frontend.app_service_url
}

# Backend
output "aks_cluster_name" {
  description = "Nome do cluster AKS"
  value       = module.backend.aks_cluster_name
}

output "aks_kube_config" {
  description = "Configuração kubectl para o AKS"
  value       = module.backend.aks_kube_config
  sensitive   = true
}

# Data
output "sql_server_fqdn" {
  description = "FQDN do SQL Server"
  value       = module.data.sql_server_fqdn
}

output "cosmos_db_account_name" {
  description = "Nome da conta do Cosmos DB"
  value       = module.data.cosmos_db_account_name
}

output "redis_cache_hostname" {
  description = "Hostname do Redis Cache"
  value       = module.data.redis_cache_hostname
}

# Security
output "key_vault_name" {
  description = "Nome do Key Vault"
  value       = module.security.key_vault_name
}

output "key_vault_uri" {
  description = "URI do Key Vault"
  value       = module.security.key_vault_uri
}

# Networking
output "app_gateway_public_ip" {
  description = "IP público do Application Gateway"
  value       = module.networking.app_gateway_public_ip
}

output "app_gateway_fqdn" {
  description = "FQDN do Application Gateway"
  value       = module.networking.app_gateway_fqdn
}

