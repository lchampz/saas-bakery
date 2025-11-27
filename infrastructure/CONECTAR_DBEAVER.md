# 🔌 Como Conectar ao PostgreSQL no DBeaver

## 📋 Informações de Conexão

### Dados do Servidor
- **Host:** `postgres-fratelli-dev-24e1ff0e.postgres.database.azure.com`
- **Porta:** `5432`
- **Database:** `postgres`
- **Usuário:** `postgresadmin`
- **Senha:** `Tigrao!1234`

## 🔧 Configuração no DBeaver

### Passo 1: Criar Nova Conexão
1. Abra o DBeaver
2. Clique em **Nova Conexão** (ícone de plug) ou `Ctrl+Shift+N`
3. Selecione **PostgreSQL**
4. Clique em **Next**

### Passo 2: Configurar Conexão

#### Aba "Main"
- **Host:** `postgres-fratelli-dev-24e1ff0e.postgres.database.azure.com`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgresadmin`
- **Password:** `Tigrao!1234`
- ✅ Marque **"Save password"** se desejar

#### Aba "SSL"
⚠️ **IMPORTANTE:** O Azure PostgreSQL requer SSL!

- ✅ Marque **"Use SSL"**
- **SSL Mode:** Selecione **"require"** ou **"verify-ca"**
- ✅ Marque **"Use SSL Factory"** (opcional, mas recomendado)

#### Aba "Driver properties" (Opcional)
Você pode adicionar propriedades customizadas se necessário:
- `sslmode=require`

### Passo 3: Testar Conexão
1. Clique em **"Test Connection"**
2. Se pedir para baixar o driver PostgreSQL, clique em **"Download"**
3. Aguarde o download e teste novamente

### Passo 4: Salvar e Conectar
1. Clique em **"Finish"**
2. A conexão será salva e você poderá expandir para ver as tabelas

## 🔥 Problema: Firewall

Se ainda der erro de conexão, seu IP pode não estar permitido no firewall do Azure.

### Solução: Adicionar seu IP ao Firewall

Execute este comando no terminal (substitua `SEU_IP` pelo seu IP público):

```bash
az postgres flexible-server firewall-rule create \
    --resource-group rg-fratelli-dev \
    --name postgres-fratelli-dev-24e1ff0e \
    --rule-name AllowMyIP \
    --start-ip-address SEU_IP \
    --end-ip-address SEU_IP
```

**Para descobrir seu IP público:**
```bash
curl https://api.ipify.org
```

**Ou adicionar automaticamente:**
```bash
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
    --resource-group rg-fratelli-dev \
    --name postgres-fratelli-dev-24e1ff0e \
    --rule-name AllowMyIP \
    --start-ip-address $MY_IP \
    --end-ip-address $MY_IP
```

## ⚠️ Erros Comuns

### Erro: "Connection refused" ou "Timeout"
- **Causa:** Firewall bloqueando seu IP
- **Solução:** Adicione seu IP ao firewall (veja acima)

### Erro: "SSL required"
- **Causa:** SSL não está habilitado
- **Solução:** Marque "Use SSL" e selecione "require" no modo SSL

### Erro: "Authentication failed"
- **Causa:** Usuário ou senha incorretos
- **Solução:** Verifique as credenciais:
  - Usuário: `postgresadmin`
  - Senha: `Tigrao!1234`

### Erro: "Database does not exist"
- **Causa:** Nome do banco incorreto
- **Solução:** Use `postgres` (banco padrão)

## 📝 Notas Importantes

1. **SSL é obrigatório** no Azure PostgreSQL
2. O firewall precisa permitir seu IP público
3. Se seu IP mudar (ex: mudou de rede), você precisará adicionar o novo IP
4. Para produção, considere usar VPN ou Private Endpoint

## 🔍 Verificar Conexão via Terminal

Você também pode testar a conexão via terminal:

```bash
psql "host=postgres-fratelli-dev-24e1ff0e.postgres.database.azure.com port=5432 dbname=postgres user=postgresadmin password=Tigrao!1234 sslmode=require"
```

Ou usando a URL completa:
```bash
psql "postgresql://postgresadmin:Tigrao!1234@postgres-fratelli-dev-24e1ff0e.postgres.database.azure.com:5432/postgres?sslmode=require"
```

