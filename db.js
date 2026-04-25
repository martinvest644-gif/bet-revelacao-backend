const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS bets (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    team      TEXT    NOT NULL CHECK(team IN ('boy', 'girl')),
    amount    REAL    NOT NULL CHECK(amount > 0),
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS state (
    id       INTEGER PRIMARY KEY CHECK(id = 1),
    revealed TEXT    CHECK(revealed IN ('boy', 'girl')),
    winners  TEXT
  );

  INSERT OR IGNORE INTO state (id, revealed, winners) VALUES (1, NULL, NULL);
`);

module.exports = db;
