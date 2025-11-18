# App Service Plan
resource "azurerm_service_plan" "frontend" {
  name                = "asp-${var.project_name}-frontend-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.environment == "production" ? "P1v3" : "B1" # B1 para dev, P1v3 para produção

  tags = var.common_tags
}

# App Service (Frontend)
resource "azurerm_linux_web_app" "frontend" {
  name                = "app-${var.project_name}-frontend-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.frontend.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }

    always_on = var.environment == "production"

    # Health check
    health_check_path = "/"
  }

  # App Settings
  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"
    "NODE_ENV"                     = var.environment
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

# Application Insights para Frontend
resource "azurerm_application_insights" "frontend" {
  name                = "appi-${var.project_name}-frontend-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  workspace_id        = azurerm_log_analytics_workspace.frontend.id

  tags = var.common_tags
}

resource "azurerm_log_analytics_workspace" "frontend" {
  name                = "law-${var.project_name}-frontend-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.common_tags
}

# Role Assignment para App Service acessar Key Vault
resource "azurerm_role_assignment" "app_service_keyvault" {
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.frontend.identity[0].principal_id
}

