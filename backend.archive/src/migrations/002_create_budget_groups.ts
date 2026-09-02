export const migration = {
  name: "002_create_budget_groups",
  up: `CREATE TABLE IF NOT EXISTS budget_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    allocated_budget REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE
  );`,
  down: `DROP TABLE IF EXISTS budget_groups;`,
};
