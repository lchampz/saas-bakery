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

variable "vnet_id" {
  description = "ID da Virtual Network"
  type        = string
}

variable "subnet_id" {
  description = "ID da subnet do AKS"
  type        = string
}

variable "key_vault_id" {
  description = "ID do Key Vault"
  type        = string
}

variable "aks_node_count" {
  description = "Número inicial de nodes"
  type        = number
}

variable "aks_vm_size" {
  description = "Tamanho das VMs"
  type        = string
}

variable "aks_min_node_count" {
  description = "Número mínimo de nodes"
  type        = number
}

variable "aks_max_node_count" {
  description = "Número máximo de nodes"
  type        = number
}

variable "enable_aks" {
  description = "Habilita criação do AKS (economy_mode desativa)"
  type        = bool
  default     = true
}
