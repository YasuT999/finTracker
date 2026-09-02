export const migration = {
  name: "001_create_months",
  up: `CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    total_budget REAL DEFAULT 0,
    total_income REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );`,
  down: `DROP TABLE IF EXISTS months;`,
};
