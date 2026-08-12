/**
 * SQLite connection (Node's built-in `node:sqlite`).
 *
 * Using the built-in driver avoids native modules entirely. The database file
 * defaults to `wifi.db` in the project root and can be overridden with the
 * `DATABASE_URL` environment variable (e.g. a full path).
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const globalForDb = globalThis as unknown as { __wifiPortalDb?: DatabaseSync };

/** Path to the SQLite database file. */
export function databasePath(): string {
  return process.env.DATABASE_URL ?? path.join(process.cwd(), 'wifi.db');
}

/** Open (or reuse) the SQLite database connection. */
export function getDb(): DatabaseSync {
  if (!globalForDb.__wifiPortalDb) {
    const db = new DatabaseSync(databasePath());
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    globalForDb.__wifiPortalDb = db;
  }
  return globalForDb.__wifiPortalDb;
}

/** Current UTC timestamp as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}
