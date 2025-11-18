# Azure Kubernetes Service
resource "azurerm_kubernetes_cluster" "main" {
  count               = var.enable_aks ? 1 : 0
  name                = "aks-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project_name}-${var.environment}"
  kubernetes_version  = "1.28"

  default_node_pool {
    name                = "default"
    vm_size             = var.aks_vm_size
    os_disk_size_gb     = 30
    type                = "VirtualMachineScaleSets"
    min_count           = var.aks_min_node_count
    max_count           = var.aks_max_node_count
    vnet_subnet_id      = var.subnet_id
    enable_auto_scaling = true
  }

  # Network Profile
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
  }

  # Identity
  identity {
    type = "SystemAssigned"
  }

  # RBAC
  role_based_access_control_enabled = true

  # Azure Policy
  azure_policy_enabled = true

  # OMS Agent (Log Analytics)
  dynamic "oms_agent" {
    for_each = var.enable_aks ? [1] : []
    content {
      log_analytics_workspace_id = azurerm_log_analytics_workspace.main[0].id
    }
  }

  tags = var.common_tags
}

# Log Analytics Workspace para AKS
resource "azurerm_log_analytics_workspace" "main" {
  count               = var.enable_aks ? 1 : 0
  name                = "law-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.common_tags
}

# Azure Function App (Plano Consumption)
resource "azurerm_storage_account" "functions" {
  name                     = "st${replace(var.project_name, "-", "")}${var.environment}${substr(md5(var.resource_group_name), 0, 8)}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.common_tags
}

resource "azurerm_service_plan" "functions" {
  name                = "asp-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Windows"
  sku_name            = "Y1" # Consumption Plan

  tags = var.common_tags
}

resource "azurerm_windows_function_app" "main" {
  name                = "func-${var.project_name}-${var.environment}-${substr(md5(var.resource_group_name), 0, 8)}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.functions.id

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  site_config {
    application_stack {
      node_version = "~18"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"                 = "node"
    "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING" = azurerm_storage_account.functions.primary_connection_string
    "WEBSITE_CONTENTSHARE"                     = azurerm_storage_account.functions.name
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

# Application Insights para Functions
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "Node.JS"
  workspace_id        = var.enable_aks ? azurerm_log_analytics_workspace.main[0].id : null

  tags = var.common_tags
}

# Role Assignment para AKS acessar Key Vault
resource "azurerm_role_assignment" "aks_keyvault" {
  count                = var.enable_aks ? 1 : 0
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_kubernetes_cluster.main[0].kubelet_identity[0].object_id
}

# Role Assignment para Functions acessar Key Vault
resource "azurerm_role_assignment" "functions_keyvault" {
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_windows_function_app.main.identity[0].principal_id
}

