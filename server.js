require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Disponibiliza io para as rotas via app.get('io')
app.set('io', io);

app.use('/api/bets', require('./routes/bets'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/state', (req, res) => {
  const state = db.prepare('SELECT revealed, winners FROM state WHERE id = 1').get();
  return res.json({
    revealed: state.revealed ?? null,
    winners: state.winners ? JSON.parse(state.winners) : null,
  });
});

app.get('/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log(`[socket] conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[socket] desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`BET Revelação rodando na porta ${PORT}`);
});
