const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');

// Inicializa o app e o servidor HTTP
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve arquivos estáticos (se necessário)
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz simples
app.get('/', (req, res) => {
  res.send('Servidor WhatsApp está online!');
});

// Inicia o cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.toDataURL(qr, (err, url) => {
    io.emit('qr', url); // envia o QR para o front-end via socket
    io.emit('message', 'QR Code recebido, escaneie com seu WhatsApp.');
  });
});

client.on('ready', () => {
  console.log('Cliente está pronto!');
  io.emit('ready', 'Cliente está pronto!');
  io.emit('message', 'WhatsApp está conectado!');
});

client.on('authenticated', () => {
  io.emit('message', 'Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
  console.error('Falha na autenticação', msg);
  io.emit('message', 'Falha na autenticação');
});

client.on('disconnected', () => {
  io.emit('message', 'WhatsApp desconectado!');
  client.initialize();
});

// Inicia o socket.io
io.on('connection', (socket) => {
  socket.emit('message', 'Conectado ao servidor');
});

client.initialize();

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
