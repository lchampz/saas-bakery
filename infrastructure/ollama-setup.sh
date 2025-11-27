#!/bin/bash
set -e

# Atualizar sistema
apt-get update
apt-get upgrade -y

# Instalar dependências
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $USER

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Criar diretório para Ollama
mkdir -p /opt/ollama
cd /opt/ollama

# Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama-service
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  ollama-data:
    driver: local
EOF

# Iniciar Ollama
docker-compose up -d

# Aguardar Ollama iniciar
sleep 10

# Baixar modelo
docker exec ollama-service ollama pull ${ollama_model}

# Criar script de gerenciamento
cat > /usr/local/bin/ollama-manage << 'EOF'
#!/bin/bash
case "$1" in
  start)
    cd /opt/ollama && docker-compose up -d
    ;;
  stop)
    cd /opt/ollama && docker-compose down
    ;;
  restart)
    cd /opt/ollama && docker-compose restart
    ;;
  status)
    cd /opt/ollama && docker-compose ps
    ;;
  logs)
    cd /opt/ollama && docker-compose logs -f ollama
    ;;
  pull)
    docker exec ollama-service ollama pull $2
    ;;
  list)
    docker exec ollama-service ollama list
    ;;
  *)
    echo "Usage: ollama-manage {start|stop|restart|status|logs|pull|list}"
    exit 1
    ;;
esac
EOF

chmod +x /usr/local/bin/ollama-manage

# Configurar sistema para iniciar Ollama no boot
systemctl enable docker

echo "Ollama instalado e configurado com sucesso!"
echo "Modelo ${ollama_model} baixado."
echo "Use 'ollama-manage' para gerenciar o serviço."

