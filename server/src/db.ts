import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let db: Database;

export async function getDb(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, '../../data.db'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'single',
      order_index INTEGER DEFAULT 0,
      image_url TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  await db.run('PRAGMA foreign_keys = ON');

  // migration: add image_url if not exists
  const cols = await db.all("PRAGMA table_info(questions)");
  if (!cols.find((c: any) => c.name === 'image_url')) {
    await db.run('ALTER TABLE questions ADD COLUMN image_url TEXT');
  }

  return db;
}
