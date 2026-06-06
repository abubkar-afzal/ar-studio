const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'public', 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  }
  console.log('Database created at', DB_PATH);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  )`);

  db.run(`INSERT OR IGNORE INTO user_settings (key, value) VALUES ('theme', 'light')`);
});

db.close(() => {
  console.log('Database initialised successfully.');
});