// pages/api/save-settings.js
import { openDb } from './db.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { theme } = req.body;
  if (!theme) {
    return res.status(400).json({ error: 'Theme is required.' });
  }

  const db = openDb();

  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  )`);

  db.run(
    `INSERT INTO user_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ['theme', theme],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.status(200).json({ success: true, theme });
    }
  );
}