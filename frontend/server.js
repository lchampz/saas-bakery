// Servidor simples para servir arquivos estáticos no Azure App Service
// Usa CommonJS para compatibilidade
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;

// Servir arquivos estáticos da pasta atual (onde estão os arquivos buildados)
app.use(express.static(path.join(__dirname)));

// Suporte para client-side routing (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('Erro ao servir index.html:', err);
      res.status(500).send('Erro ao carregar a aplicação');
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).send('Erro interno do servidor');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📁 Diretório: ${__dirname}`);
});

// Tratamento de erros no servidor
server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});
