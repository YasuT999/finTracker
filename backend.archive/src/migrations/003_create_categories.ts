export const migration = {
  name: "003_create_categories",
  up: `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    allocated_budget REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES budget_groups(id) ON DELETE CASCADE
  );`,
  down: `DROP TABLE IF EXISTS categories;`,
};
