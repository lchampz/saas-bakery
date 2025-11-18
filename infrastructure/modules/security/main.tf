# Key Vault
resource "azurerm_key_vault" "main" {
  name                = "kv-${var.project_name}-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "standard"

  # Soft delete e purge protection para produção
  soft_delete_retention_days = var.environment == "production" ? 90 : 7
  purge_protection_enabled   = var.environment == "production"

  # Network ACLs - permitir acesso de qualquer lugar (ajustar conforme necessário)
  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = var.common_tags
}

# Obter configuração do cliente atual
data "azurerm_client_config" "current" {}

# Access Policy para o usuário atual
resource "azurerm_key_vault_access_policy" "current_user" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  key_permissions = [
    "Get", "List", "Create", "Update", "Delete", "Recover", "Backup", "Restore"
  ]

  secret_permissions = [
    "Get", "List", "Set", "Delete", "Recover", "Backup", "Restore"
  ]

  certificate_permissions = [
    "Get", "List", "Create", "Update", "Delete", "Recover", "Backup", "Restore"
  ]
}

# Microsoft Defender for Cloud - Habilitar para o Resource Group
# Nota: Defender for Cloud é habilitado por padrão, mas podemos criar alertas customizados
resource "azurerm_security_center_subscription_pricing" "main" {
  tier          = var.environment == "production" ? "Standard" : "Free"
  resource_type = "VirtualMachines"
}

resource "azurerm_security_center_subscription_pricing" "app_services" {
  tier          = var.environment == "production" ? "Standard" : "Free"
  resource_type = "AppServices"
}

resource "azurerm_security_center_subscription_pricing" "sql_servers" {
  tier          = var.environment == "production" ? "Standard" : "Free"
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "kubernetes" {
  tier          = var.environment == "production" ? "Standard" : "Free"
  resource_type = "KubernetesService"
}

