# Public IP para Ollama VM (opcional - apenas se use_public_ip = true)
# Para reduzir custos, use IP privado e conecte via VNet Peering ou VPN
resource "azurerm_public_ip" "ollama" {
  count               = var.ollama_use_public_ip ? 1 : 0
  name                = "pip-ollama-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Dynamic" # Dynamic é mais barato que Static
  sku                 = "Basic"   # Tentar Basic primeiro (mais barato)

  tags = local.common_tags
}

# VM para Ollama Service
resource "azurerm_network_interface" "ollama" {
  name                = "nic-ollama-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.ollama.id
    private_ip_address_allocation = "Dynamic"
    # IP público apenas se habilitado (para reduzir custos)
    public_ip_address_id = var.ollama_use_public_ip ? azurerm_public_ip.ollama[0].id : null
  }

  tags = local.common_tags
}

# Virtual Network para Ollama (se não existir)
resource "azurerm_virtual_network" "ollama" {
  count               = var.create_vnet_for_ollama ? 1 : 0
  name                = "vnet-ollama-${var.environment}"
  address_space       = ["10.1.0.0/16"]
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

# Output para VNet ID (para VNet Peering)
output "ollama_vnet_id" {
  value       = var.create_vnet_for_ollama ? azurerm_virtual_network.ollama[0].id : null
  description = "ID da VNet do Ollama (para VNet Peering)"
}

# Subnet para Ollama
resource "azurerm_subnet" "ollama" {
  name                 = "subnet-ollama-${var.environment}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = var.create_vnet_for_ollama ? azurerm_virtual_network.ollama[0].name : var.existing_vnet_name
  address_prefixes     = ["10.1.1.0/24"]

  # Terraform automaticamente detecta dependências através das referências acima
  # Se create_vnet_for_ollama = true, usa azurerm_virtual_network.ollama[0].name
  # Se false, usa var.existing_vnet_name (que deve existir)
}

# Network Security Group para Ollama
resource "azurerm_network_security_group" "ollama" {
  name                = "nsg-ollama-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  # Regra para SSH
  security_rule {
    name                       = "SSH"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Regra para Ollama API
  security_rule {
    name                       = "Ollama-API"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "11434"
    source_address_prefix      = "*" # Em produção, restringir para IPs específicos
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

# Associar NSG à Network Interface
resource "azurerm_network_interface_security_group_association" "ollama" {
  network_interface_id      = azurerm_network_interface.ollama.id
  network_security_group_id = azurerm_network_security_group.ollama.id
}

# Linux Virtual Machine para Ollama
resource "azurerm_linux_virtual_machine" "ollama" {
  name                = "vm-ollama-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  size                = var.ollama_vm_size
  admin_username      = var.ollama_vm_admin_username
  # Especificar zona se fornecida, caso contrário Azure escolhe automaticamente
  zone = var.ollama_vm_zone

  lifecycle {
    ignore_changes = [zone]
  }

  network_interface_ids = [
    azurerm_network_interface.ollama.id,
  ]

  admin_ssh_key {
    username   = var.ollama_vm_admin_username
    public_key = var.ollama_vm_ssh_public_key
  }

  os_disk {
    name                 = "osdisk-ollama-${var.environment}"
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS" # Standard é mais barato que Premium
    disk_size_gb         = var.ollama_vm_disk_size
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    # Usar gen1 para compatibilidade universal (funciona com todos os tamanhos)
    # Gen2 só funciona com tamanhos mais novos (Standard_B*, Standard_D*, etc)
    sku     = "22_04-lts" # Gen1 - compatível com todos os tamanhos
    version = "latest"
  }

  # Custom data para instalar Docker e configurar Ollama
  custom_data = base64encode(templatefile("${path.module}/ollama-setup.sh", {
    ollama_model = var.ollama_model
  }))

  tags = local.common_tags
}

# Outputs
output "ollama_vm_public_ip" {
  value       = var.ollama_use_public_ip ? azurerm_public_ip.ollama[0].ip_address : null
  description = "Public IP address of the Ollama VM (null if using private IP only)"
}

output "ollama_vm_private_ip" {
  value       = azurerm_network_interface.ollama.private_ip_address
  description = "Private IP address of the Ollama VM"
}

output "ollama_api_url" {
  value       = var.ollama_use_public_ip ? "http://${azurerm_public_ip.ollama[0].ip_address}:11434" : "http://${azurerm_network_interface.ollama.private_ip_address}:11434"
  description = "Ollama API URL (use private IP if public IP is disabled)"
}

output "ollama_ssh_command" {
  value       = var.ollama_use_public_ip ? "ssh ${var.ollama_vm_admin_username}@${azurerm_public_ip.ollama[0].ip_address}" : "ssh ${var.ollama_vm_admin_username}@${azurerm_network_interface.ollama.private_ip_address} (via VPN/VNet Peering)"
  description = "SSH command to connect to Ollama VM"
}

output "ollama_use_public_ip" {
  value       = var.ollama_use_public_ip
  description = "Whether public IP is enabled for Ollama VM"
}

