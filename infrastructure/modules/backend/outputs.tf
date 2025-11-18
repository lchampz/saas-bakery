output "aks_cluster_name" {
  description = "Nome do cluster AKS"
  value       = length(azurerm_kubernetes_cluster.main) > 0 ? azurerm_kubernetes_cluster.main[0].name : ""
}

output "aks_fqdn" {
  description = "FQDN do cluster AKS"
  value       = length(azurerm_kubernetes_cluster.main) > 0 ? azurerm_kubernetes_cluster.main[0].fqdn : ""
}

output "aks_kube_config" {
  description = "Configuração kubectl"
  value       = length(azurerm_kubernetes_cluster.main) > 0 ? azurerm_kubernetes_cluster.main[0].kube_config_raw : ""
  sensitive   = true
}

output "function_app_name" {
  description = "Nome do Function App"
  value       = azurerm_windows_function_app.main.name
}

output "function_app_url" {
  description = "URL do Function App"
  value       = "https://${azurerm_windows_function_app.main.default_hostname}"
}

