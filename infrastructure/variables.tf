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

# Ollama VM
variable "ollama_vm_size" {
  description = "Tamanho da VM para Ollama. Tente: Standard_B1ms, Standard_A1_v2, Standard_A2_v2, ou Standard_D2s_v3"
  type        = string
  default     = "Standard_B1ms" # 1 vCPU, 2GB RAM - mais provável de estar disponível
}

variable "ollama_vm_admin_username" {
  description = "Usuário administrador da VM Ollama"
  type        = string
  default     = "ollamaadmin"
}

variable "ollama_vm_ssh_public_key" {
  description = "Chave SSH pública para acesso à VM Ollama"
  type        = string
  sensitive   = true
}

variable "ollama_vm_disk_size" {
  description = "Tamanho do disco da VM Ollama em GB"
  type        = number
  default     = 64
}

variable "ollama_model" {
  description = "Modelo Ollama a ser baixado (ex: llama3.2, mistral)"
  type        = string
  default     = "llama3.2"
}

variable "create_vnet_for_ollama" {
  description = "Criar uma nova VNet para Ollama ou usar uma existente"
  type        = bool
  default     = true
}

variable "existing_vnet_name" {
  description = "Nome da VNet existente (se create_vnet_for_ollama = false)"
  type        = string
  default     = ""
}

variable "ollama_use_public_ip" {
  description = "Usar IP público para VM Ollama (false = apenas IP privado, mais barato)"
  type        = bool
  default     = false # Por padrão, usar apenas IP privado para reduzir custos
}

variable "ollama_vm_zone" {
  description = "Zona de disponibilidade para VM Ollama (1, 2, 3 ou null para auto-seleção). Se houver problemas de capacidade, tente especificar uma zona."
  type        = number
  default     = null # null = Azure escolhe automaticamente
}
