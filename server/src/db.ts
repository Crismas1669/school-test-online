import { open, Database } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import path from 'path';

let db: Database;

export async function getDb(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, '../../data.db'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      author_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
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

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run('PRAGMA foreign_keys = ON');

  // migrations
  const qCols = await db.all("PRAGMA table_info(questions)");
  if (!qCols.find((c: any) => c.name === 'image_url')) {
    await db.run('ALTER TABLE questions ADD COLUMN image_url TEXT');
  }
  const tCols = await db.all("PRAGMA table_info(tests)");
  if (!tCols.find((c: any) => c.name === 'author_id')) {
    await db.run('ALTER TABLE tests ADD COLUMN author_id INTEGER');
  }

  return db;
}
