variable "resource_group_name" {
  description = "Nome do grupo de recursos"
  type        = string
}

variable "location" {
  description = "Região do Azure"
  type        = string
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
}

variable "environment" {
  description = "Ambiente"
  type        = string
}

variable "common_tags" {
  description = "Tags comuns para todos os recursos"
  type        = map(string)
}

variable "key_vault_id" {
  description = "ID do Key Vault"
  type        = string
}

variable "sql_admin_login" {
  description = "Usuário administrador do SQL"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "Senha do administrador do SQL"
  type        = string
  sensitive   = true
}

variable "sql_sku_name" {
  description = "SKU do Azure SQL Database (ex: GP_S_Gen5_2, S0, Basic)"
  type        = string
  default     = "GP_S_Gen5_2"
}

variable "enable_redis" {
  description = "Habilita criação do Redis"
  type        = bool
  default     = true
}
variable "cosmos_db_throughput" {
  description = "Throughput inicial do Cosmos DB"
  type        = number
}

variable "cosmos_db_max_throughput" {
  description = "Throughput máximo do Cosmos DB com autoscale"
  type        = number
}

