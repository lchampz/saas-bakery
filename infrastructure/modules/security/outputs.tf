output "key_vault_id" {
  description = "ID do Key Vault"
  value       = azurerm_key_vault.main.id
}

output "key_vault_name" {
  description = "Nome do Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI do Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

