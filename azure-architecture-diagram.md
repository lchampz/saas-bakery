# Diagrama de Arquitetura Azure - Fratelli

## Arquitetura na Nuvem Azure

```mermaid
graph TB
    %% Camada de Internet
    Internet[("🌐 Internet")]
    
    %% Azure Front Door / CDN
    AFD["🔷 Azure Front Door<br/>Global Load Balancer<br/>DDoS Protection"]
    
    %% Camada de Frontend
    SWA["📱 Azure Static Web Apps<br/>Frontend React<br/>CDN + Custom Domain"]
    
    %% Application Gateway
    AGW["🔷 Application Gateway<br/>WAF<br/>SSL Termination<br/>Routing Rules"]
    
    %% Camada de Backend
    AKS["🐳 Azure Kubernetes Service<br/>Backend API<br/>Auto-scaling<br/>Health Checks"]
    
    %% Azure Functions
    FUNC["⚡ Azure Functions<br/>Event Processing<br/>Webhooks iFood<br/>Background Jobs"]
    
    %% Camada de Dados
    SQL["🗄️ Azure Database for PostgreSQL<br/>Flexible Server<br/>High Availability<br/>Automated Backups"]
    
    %% Redis Cache
    REDIS["⚡ Azure Cache for Redis<br/>Session Storage<br/>API Caching"]
    
    %% Storage
    STORAGE["📦 Azure Storage Account<br/>Blob Storage<br/>Logs & Analytics"]
    
    %% Key Vault
    KV["🔐 Azure Key Vault<br/>Secrets Management<br/>JWT Secrets<br/>DB Credentials"]
    
    %% Monitoramento
    MONITOR["📊 Azure Monitor<br/>Application Insights<br/>Log Analytics<br/>Alerts"]
    
    %% Rede e Segurança
    VNET["🌐 Virtual Network<br/>10.0.0.0/16"]
    NSG1["🛡️ Network Security Group<br/>Frontend Tier"]
    NSG2["🛡️ Network Security Group<br/>Backend Tier"]
    NSG3["🛡️ Network Security Group<br/>Data Tier"]
    
    %% Subnets
    SUBNET1["📡 Frontend Subnet<br/>10.0.1.0/24"]
    SUBNET2["⚙️ Backend Subnet<br/>10.0.2.0/24"]
    SUBNET3["🗄️ Data Subnet<br/>10.0.3.0/24"]
    
    %% RBAC e Governança
    RBAC["👥 Azure RBAC<br/>Role-based Access Control"]
    POLICY["📋 Azure Policy<br/>Compliance & Governance"]
    
    %% Fluxo de dados
    Internet --> AFD
    AFD --> SWA
    AFD --> AGW
    AGW --> AKS
    AGW --> FUNC
    
    AKS --> SQL
    AKS --> REDIS
    AKS --> STORAGE
    AKS --> KV
    
    FUNC --> SQL
    FUNC --> STORAGE
    
    %% Rede
    VNET --> SUBNET1
    VNET --> SUBNET2
    VNET --> SUBNET3
    
    SUBNET1 --> NSG1
    SUBNET2 --> NSG2
    SUBNET3 --> NSG3
    
    %% Monitoramento
    AKS --> MONITOR
    FUNC --> MONITOR
    SQL --> MONITOR
    
    %% Segurança
    KV --> RBAC
    AKS --> RBAC
    SQL --> RBAC
    
    POLICY --> RBAC
    
    %% Estilos
    classDef azure fill:#0078d4,stroke:#005a9e,stroke-width:2px,color:#fff
    classDef security fill:#d83b01,stroke:#a52a2a,stroke-width:2px,color:#fff
    classDef data fill:#107c10,stroke:#0e6e0e,stroke-width:2px,color:#fff
    classDef network fill:#8764b8,stroke:#6b46a3,stroke-width:2px,color:#fff
    
    class AFD,SWA,AKS,FUNC,AGW azure
    class KV,RBAC,POLICY,NSG1,NSG2,NSG3 security
    class SQL,REDIS,STORAGE data
    class VNET,SUBNET1,SUBNET2,SUBNET3 network
```

## Componentes da Arquitetura

### 🌐 Camada de Internet
- **Azure Front Door**: CDN global, proteção DDoS, balanceamento de carga
- **Custom Domain**: domínio personalizado com SSL/TLS

### 📱 Camada de Frontend
- **Azure Static Web Apps**: hospedagem do React SPA
- **CDN integrado**: entrega global de conteúdo estático
- **Custom Domain**: domínio personalizado com HTTPS

### ⚙️ Camada de Backend
- **Azure Kubernetes Service (AKS)**: orquestração de containers
- **Azure Functions**: processamento de eventos e webhooks
- **Auto-scaling**: escalonamento automático baseado em métricas

### 🗄️ Camada de Dados
- **Azure Database for PostgreSQL**: banco principal com alta disponibilidade
- **Azure Cache for Redis**: cache de sessões e API
- **Azure Storage**: armazenamento de logs e arquivos

### 🔒 Camada de Segurança
- **Azure Key Vault**: gerenciamento centralizado de segredos
- **Network Security Groups**: isolamento de rede por camadas
- **Azure RBAC**: controle de acesso baseado em funções

### 📊 Monitoramento e Governança
- **Azure Monitor**: monitoramento completo da aplicação
- **Application Insights**: telemetria e performance
- **Azure Policy**: conformidade e governança
