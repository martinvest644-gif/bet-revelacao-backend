const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { name, team, amount } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name é obrigatório' });
  }
  if (team !== 'boy' && team !== 'girl') {
    return res.status(400).json({ error: 'team deve ser "boy" ou "girl"' });
  }
  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount deve ser um número positivo' });
  }

  const stmt = db.prepare(
    'INSERT INTO bets (name, team, amount) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name.trim(), team, parsedAmount);

  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(result.lastInsertRowid);

  const io = req.app.get('io');
  io.emit('bet:new', { bet });

  return res.status(201).json({ bet });
});

router.get('/', (req, res) => {
  const bets = db.prepare(
    'SELECT id, name, team, amount, created_at FROM bets ORDER BY created_at ASC'
  ).all();
  return res.json({ bets });
});

module.exports = router;
