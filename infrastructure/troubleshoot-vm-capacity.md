# 🔧 Troubleshooting - Problemas de Capacidade de VM

## Problema

Mesmo que um tamanho de VM apareça na lista de tamanhos disponíveis, você pode receber o erro:

```
SkuNotAvailable: The requested VM size for resource 'Following SKUs have failed for Capacity Restrictions'
```

Isso significa que **não há capacidade disponível** na região/zona específica, mesmo que o tamanho seja suportado.

## Soluções

### 1. Tentar Zonas Diferentes

O Azure tem múltiplas zonas de disponibilidade (1, 2, 3). Tente especificar uma zona diferente:

**Edite `terraform.tfvars`:**
```hcl
ollama_vm_zone = 1  # Tente 1, 2 ou 3
```

**Ou tente sem zona (deixe Azure escolher):**
```hcl
# ollama_vm_zone = null  # Comentar ou remover a linha
```

### 2. Usar Tamanho Maior

Tamanhos maiores geralmente têm mais disponibilidade. Tente:

**Opção A - Standard_A1_v2 (1 vCPU, 3.5GB RAM):**
```hcl
ollama_vm_size = "Standard_A1_v2"
```

**Opção B - Standard_A2_v2 (2 vCPUs, 7GB RAM):**
```hcl
ollama_vm_size = "Standard_A2_v2"
```

**Opção C - Standard_D2s_v3 (2 vCPUs, 8GB RAM - mais caro, mas geralmente disponível):**
```hcl
ollama_vm_size = "Standard_D2s_v3"
```

### 3. Mudar de Região

Se nenhuma zona funcionar, considere mudar de região:

**Edite `terraform.tfvars`:**
```hcl
location = "eastus"  # ou "westus2", "southcentralus"
```

**Regiões alternativas no Brasil:**
- `brazilsouth` (atual)
- Infelizmente, Azure tem apenas uma região no Brasil

**Regiões nos EUA (geralmente mais disponibilidade):**
- `eastus` (Leste dos EUA)
- `westus2` (Oeste dos EUA 2)
- `southcentralus` (Centro-Sul dos EUA)

### 4. Aguardar e Tentar Novamente

Às vezes, a capacidade é liberada após alguns minutos/horas. Tente novamente mais tarde.

### 5. Solicitar Aumento de Cota

Se você tem uma subscription com suporte, pode solicitar aumento de cota:

```bash
az vm list-usage --location brazilsouth --output table
```

E então solicitar aumento via Azure Portal ou suporte.

## Script de Teste Automático

Execute o script para testar diferentes combinações:

```bash
./test-vm-deployment.sh
```

## Recomendações por Prioridade

### Prioridade 1: Tentar Zonas
1. Tente `ollama_vm_zone = 1`
2. Se falhar, tente `ollama_vm_zone = 2`
3. Se falhar, tente `ollama_vm_zone = 3`
4. Se todas falharem, tente `ollama_vm_zone = null`

### Prioridade 2: Tamanho Alternativo
1. `Standard_A1_v2` (similar ao B1ms, mas série A)
2. `Standard_A2_v2` (mais recursos, mas ainda econômico)
3. `Standard_D2s_v3` (mais caro, mas geralmente disponível)

### Prioridade 3: Mudar Região
- Se possível, use `eastus` ou `westus2` (mais disponibilidade)

## Exemplo de Configuração Final

Se `Standard_B1ms` não funcionar em nenhuma zona:

```hcl
# terraform.tfvars
ollama_vm_size = "Standard_A1_v2"  # Alternativa econômica
ollama_vm_zone = null              # Deixar Azure escolher
location = "brazilsouth"           # Manter região atual
```

Ou se precisar de mais garantia:

```hcl
ollama_vm_size = "Standard_D2s_v3"  # Mais caro, mas mais disponível
ollama_vm_zone = null
```

