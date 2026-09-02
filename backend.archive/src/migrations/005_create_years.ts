export const migration = {
  name: "005_create_years",
  up: `CREATE TABLE IF NOT EXISTS years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );`,
  down: `DROP TABLE IF EXISTS years;`,
};
