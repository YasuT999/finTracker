import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const database = await SQLite.openDatabaseAsync("finance.db");
    await database.execAsync("PRAGMA journal_mode = WAL;");
    await database.execAsync("PRAGMA foreign_keys = ON;");
    db = database;
    await runMigrations(database);
    return database;
  })();
  return initPromise;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}

// expo-sqlite persists automatically; saveDb is no-op for API parity
export function saveDb(): void {}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at TEXT DEFAULT (datetime('now'))
    );`
  );

  const existing = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM _migrations"
  );
  const runNames = new Set(existing.map((r) => r.name));

  for (const m of MIGRATIONS) {
    if (!runNames.has(m.name)) {
      // 006 may fail if column already exists (re-run edge)
      try {
        if (m.name === "007_backfill_year_id") {
          // split into two statements for expo-sqlite (execAsync handles multiple but be explicit)
          await database.execAsync("INSERT OR IGNORE INTO years (name) VALUES ('2026');");
          await database.execAsync(
            "UPDATE months SET year_id = (SELECT id FROM years WHERE name = '2026') WHERE year_id IS NULL;"
          );
        } else {
          await database.execAsync(m.up);
        }
      } catch (e: any) {
        // ALTER duplicate column is idempotent — ignore "duplicate column name: year_id"
        if (m.name === "006_add_year_id_to_months" && String(e?.message).includes("duplicate column")) {
          // column already exists, continue
        } else {
          throw e;
        }
      }
      await database.runAsync("INSERT OR IGNORE INTO _migrations (name) VALUES (?)", [m.name]);
    }
  }
}
