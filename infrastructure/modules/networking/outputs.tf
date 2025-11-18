output "vnet_id" {
  description = "ID da Virtual Network"
  value       = azurerm_virtual_network.main.id
}

output "aks_subnet_id" {
  description = "ID da subnet do AKS"
  value       = azurerm_subnet.aks.id
}

output "app_gateway_id" {
  description = "ID do Application Gateway"
  value       = azurerm_application_gateway.main.id
}

output "app_gateway_public_ip" {
  description = "IP público do Application Gateway"
  value       = azurerm_public_ip.app_gateway.ip_address
}

output "app_gateway_fqdn" {
  description = "FQDN do Application Gateway"
  value       = azurerm_public_ip.app_gateway.fqdn
}

