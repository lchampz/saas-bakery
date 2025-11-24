# 🚀 Guia de Deploy do Frontend

Este guia explica como fazer deploy do frontend React/Vite para o Azure App Service.

## 📋 Pré-requisitos

1. **Azure CLI instalado**: [Instalar Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
2. **Login no Azure**: `az login`
3. **Node.js 18+** instalado localmente
4. **Terraform aplicado**: A infraestrutura deve estar provisionada

## 🚀 Deploy Automático (Recomendado)

### Opção 1: Script de Deploy Automático

O script `deploy.sh` automatiza todo o processo:

```bash
cd frontend
./deploy.sh
```

O script irá:
- ✅ Obter automaticamente o nome do App Service do Terraform
- ✅ Instalar dependências se necessário
- ✅ Fazer build do projeto
- ✅ Criar arquivos de configuração necessários
- ✅ Fazer deploy para o Azure App Service

### Opção 2: Deploy Manual com Parâmetros

Se preferir especificar manualmente:

```bash
cd frontend
./deploy.sh app-fratelli-frontend-dev-24e1ff0e rg-fratelli-dev
```

## 🔧 Deploy Manual Passo a Passo

Se preferir fazer manualmente:

### 1. Obter Informações do App Service

```bash
cd infrastructure
terraform output app_service_name
terraform output resource_group_name
```

### 2. Fazer Build do Projeto

```bash
cd frontend
npm install
npm run build
```

### 3. Preparar Arquivos para Deploy

O App Service precisa de:
- Arquivos buildados na pasta `dist/`
- Um `server.js` para servir os arquivos estáticos
- Um `package.json` na pasta `dist/` com as dependências do servidor

O script `deploy.sh` faz isso automaticamente, mas você pode fazer manualmente:

```bash
# Copiar server.js e package.json para dist
cp server.js dist/
cat > dist/package.json << 'EOF'
{
  "name": "fratelli-frontend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF
```

### 4. Fazer Deploy via Azure CLI

```bash
# Criar zip com os arquivos
cd dist
zip -r ../deploy.zip .
cd ..

# Fazer deploy
az webapp deploy \
    --resource-group rg-fratelli-dev \
    --name app-fratelli-frontend-dev-24e1ff0e \
    --src-path deploy.zip \
    --type zip

# Limpar
rm deploy.zip
```

### 5. Instalar Dependências no App Service

Após o deploy, instale as dependências do servidor:

```bash
az webapp ssh \
    --resource-group rg-fratelli-dev \
    --name app-fratelli-frontend-dev-24e1ff0e \
    --command "cd /home/site/wwwroot && npm install"
```

Ou configure para instalar automaticamente via App Settings (já configurado no Terraform).

## 🔍 Verificar Deploy

Após o deploy, acesse:

```bash
# Obter URL
cd infrastructure
terraform output app_service_url
```

Ou acesse diretamente:
```
https://app-fratelli-frontend-dev-24e1ff0e.azurewebsites.net
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'express'"

O App Service precisa instalar as dependências. Execute:

```bash
az webapp ssh \
    --resource-group rg-fratelli-dev \
    --name app-fratelli-frontend-dev-24e1ff0e \
    --command "cd /home/site/wwwroot && npm install"
```

Ou configure via Azure Portal:
1. Vá para **Configurações** → **Configuração geral**
2. Adicione em **Comando de inicialização**: `npm install && npm start`

### Erro 404 em rotas do React Router

Certifique-se de que o `server.js` está servindo `index.html` para todas as rotas (já configurado).

### Site não atualiza após deploy

1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique os logs do App Service:
   ```bash
   az webapp log tail \
       --resource-group rg-fratelli-dev \
       --name app-fratelli-frontend-dev-24e1ff0e
   ```

### Ver Logs do App Service

```bash
az webapp log tail \
    --resource-group rg-fratelli-dev \
    --name app-fratelli-frontend-dev-24e1ff0e
```

Ou via Azure Portal:
- **Monitoramento** → **Log stream**

## 📝 Estrutura de Arquivos no App Service

Após o deploy, a estrutura no App Service será:

```
/home/site/wwwroot/
├── index.html          # Arquivo principal
├── assets/            # Arquivos JS/CSS buildados
├── server.js          # Servidor Express
└── package.json       # Dependências do servidor
```

## 🔄 Deploy Contínuo (CI/CD)

Para configurar deploy automático via GitHub Actions ou Azure DevOps, consulte:
- [GitHub Actions para Azure App Service](https://docs.microsoft.com/azure/app-service/deploy-github-actions)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/targets/webapp)

## 📚 Referências

- [Documentação: Deploy para Azure App Service](https://docs.microsoft.com/azure/app-service/deploy-zip)
- [Documentação: Configurar Node.js no App Service](https://docs.microsoft.com/azure/app-service/configure-language-nodejs)

