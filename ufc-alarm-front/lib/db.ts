import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "app.db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  preferred_name  TEXT,
  phone           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alarms (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_slug         TEXT NOT NULL,
  bout_id            TEXT NOT NULL,
  event_title        TEXT NOT NULL,
  event_starts_at    TEXT,
  weight_class       TEXT,
  fighter_red_name   TEXT NOT NULL,
  fighter_blue_name  TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, event_slug, bout_id)
);
CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms(user_id);

CREATE TABLE IF NOT EXISTS devices (
  device_id     TEXT PRIMARY KEY,
  fcm_token     TEXT,
  platform      TEXT NOT NULL DEFAULT 'android',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device_alarms (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id          TEXT NOT NULL,
  event_slug         TEXT NOT NULL,
  bout_id            TEXT NOT NULL,
  event_title        TEXT NOT NULL,
  event_starts_at    TEXT,
  weight_class       TEXT,
  fighter_red_name   TEXT NOT NULL,
  fighter_blue_name  TEXT NOT NULL,
  notified_at        TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (device_id, event_slug, bout_id)
);
CREATE INDEX IF NOT EXISTS idx_device_alarms_device ON device_alarms(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alarms_live_window ON device_alarms(event_starts_at, notified_at);

`;

declare global {
  var __ufcAlarmDb: Database.Database | undefined;
}

function connect(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA_SQL);
  return conn;
}

const db: Database.Database = globalThis.__ufcAlarmDb ?? connect();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ufcAlarmDb = db;
}

export default db;
