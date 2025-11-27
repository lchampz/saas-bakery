FROM ollama/ollama:latest

# Expor a porta padrão do Ollama
EXPOSE 11434

# Variáveis de ambiente
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_ORIGINS=*

# Volume para persistir modelos
VOLUME ["/root/.ollama"]

# Comando padrão
CMD ["ollama", "serve"]

