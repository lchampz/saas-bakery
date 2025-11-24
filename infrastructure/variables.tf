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

# PostgreSQL Database
variable "postgres_admin_login" {
  description = "Usuário administrador do PostgreSQL"
  type        = string
  default     = "postgresadmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "Senha do administrador do PostgreSQL"
  type        = string
  sensitive   = true
}

variable "postgres_sku_name" {
  description = "SKU do PostgreSQL Flexible Server (ex: B_Standard_B1ms para dev, GP_Standard_D2s_v3 para produção)"
  type        = string
  default     = "B_Standard_B1ms" # Burstable, 1 vCore, 2GB RAM - econômico para dev
}

variable "common_tags" {
  description = "Tags comuns para todos os recursos"
  type        = map(string)
  default     = {}
}
