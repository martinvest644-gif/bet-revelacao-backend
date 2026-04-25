const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAdmin(req, res, next) {
  const pass = req.headers['x-admin-pass'];
  const expected = process.env.ADMIN_PASS || 'admin123';
  if (pass !== expected) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

router.use(requireAdmin);

router.post('/reveal', (req, res) => {
  const { team } = req.body;
  if (team !== 'boy' && team !== 'girl') {
    return res.status(400).json({ error: 'team deve ser "boy" ou "girl"' });
  }

  db.prepare('UPDATE state SET revealed = ?, winners = NULL WHERE id = 1').run(team);

  const state = db.prepare('SELECT revealed, winners FROM state WHERE id = 1').get();
  const payload = {
    revealed: state.revealed,
    winners: state.winners ? JSON.parse(state.winners) : null,
  };

  const io = req.app.get('io');
  io.emit('state:update', payload);

  return res.json(payload);
});

router.post('/draw', (req, res) => {
  const state = db.prepare('SELECT revealed, winners FROM state WHERE id = 1').get();

  if (!state.revealed) {
    return res.status(400).json({ error: 'Faça a revelação antes de sortear' });
  }

  const allBets = db.prepare('SELECT * FROM bets ORDER BY amount DESC').all();

  if (allBets.length === 0) {
    return res.status(400).json({ error: 'Não há apostas cadastradas' });
  }

  // highestBet: maior amount (independente de time)
  const highestBet = allBets[0];

  // Candidatos ao sorteio: acertaram o time revelado
  const winners = allBets.filter((b) => b.team === state.revealed);

  let raffle = null;
  if (winners.length > 0) {
    const idx = Math.floor(Math.random() * winners.length);
    raffle = winners[idx];
  }

  const result = { highestBet, raffle };

  db.prepare('UPDATE state SET winners = ? WHERE id = 1').run(JSON.stringify(result));

  const payload = {
    revealed: state.revealed,
    winners: result,
  };

  const io = req.app.get('io');
  io.emit('state:update', payload);

  return res.json(payload);
});

router.delete('/bets/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const existing = db.prepare('SELECT id FROM bets WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Aposta não encontrada' });
  }

  db.prepare('DELETE FROM bets WHERE id = ?').run(id);

  const io = req.app.get('io');
  io.emit('bet:removed', { id });

  return res.json({ ok: true, id });
});

router.delete('/reset', (req, res) => {
  db.prepare('DELETE FROM bets').run();
  db.prepare('UPDATE state SET revealed = NULL, winners = NULL WHERE id = 1').run();

  const io = req.app.get('io');
  io.emit('state:update', { revealed: null, winners: null });

  return res.json({ ok: true });
});

module.exports = router;
