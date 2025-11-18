variable "project_name" {
  description = "Nome do projeto (usado para nomear recursos)"
  type        = string
  default     = "fratelli"
}

variable "environment" {
  description = "Ambiente de deploy (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment deve ser: dev, staging ou production"
  }
}

variable "location" {
  description = "Região do Azure onde os recursos serão criados"
  type        = string
  default     = "brazilsouth"
}

variable "subscription_id" {
  description = "ID da assinatura Azure"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "ID do tenant Azure AD"
  type        = string
  sensitive   = true
}

variable "cost_center" {
  description = "Centro de custo para tags (ex: Ecommerce)"
  type        = string
  default     = "Ecommerce"
}

# SQL Database
variable "sql_admin_login" {
  description = "Usuário administrador do SQL Database"
  type        = string
  default     = "sqladmin"
  sensitive   = true
}

variable "sql_admin_password" {
  description = "Senha do administrador do SQL Database"
  type        = string
  sensitive   = true
}

# Cosmos DB
variable "cosmos_db_throughput" {
  description = "Throughput inicial do Cosmos DB (RUs)"
  type        = number
  default     = 400
}

variable "cosmos_db_max_throughput" {
  description = "Throughput máximo do Cosmos DB com autoscale (RUs)"
  type        = number
  default     = 4000
}

# AKS Configuration
variable "aks_node_count" {
  description = "Número inicial de nodes no AKS"
  type        = number
  default     = 2
}

variable "aks_vm_size" {
  description = "Tamanho das VMs do AKS"
  type        = string
  default     = "Standard_B2s"
}

variable "aks_min_node_count" {
  description = "Número mínimo de nodes no AKS (Cluster Autoscaler)"
  type        = number
  default     = 1
}

variable "aks_max_node_count" {
  description = "Número máximo de nodes no AKS (Cluster Autoscaler)"
  type        = number
  default     = 10
}

# Perfil econômico (para Students/dev): desabilita App Gateway e AKS, desativa Redis, SQL mais barato
variable "economy_mode" {
  description = "Ativa perfil econômico (desabilita AKS e App Gateway; Redis off; SQL SKU barato)"
  type        = bool
  default     = false
}

# SKU do SQL (permitir usar Basic/S0 em economy)
variable "sql_sku_name" {
  description = "SKU do Azure SQL Database (ex: GP_S_Gen5_2, S0, Basic)"
  type        = string
  default     = "GP_S_Gen5_2"
}

