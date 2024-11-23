import Database from 'better-sqlite3';
import { DB_CONFIG } from '../config/database';
import { logger } from './logger';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function initializeDatabase() {
  await mkdir(dirname(DB_CONFIG.path), { recursive: true });
  const db = new Database(DB_CONFIG.path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guid TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      link TEXT,
      publishedAt TEXT,
      imageUrl TEXT,
      category TEXT,
      views INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export class NewsRepository {
  private db: Database.Database;

  constructor() {
    this.db = await initializeDatabase();
  }

  // ... rest of the NewsRepository class remains the same
}