output "app_service_name" {
  description = "Nome do App Service"
  value       = azurerm_linux_web_app.frontend.name
}

output "app_service_url" {
  description = "URL do App Service"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "app_service_id" {
  description = "ID do App Service"
  value       = azurerm_linux_web_app.frontend.id
}

