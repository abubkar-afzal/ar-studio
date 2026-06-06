// pages/api/db.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(process.cwd(), 'public', 'database.sqlite');

let db = null;

export function openDb() {
  if (db) return db;
  db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to SQLite database.');
    }
  });
  return db;
}