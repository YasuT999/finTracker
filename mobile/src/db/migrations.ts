export const MIGRATIONS = [
  {
    name: "001_create_months",
    up: `CREATE TABLE IF NOT EXISTS months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      total_budget REAL DEFAULT 0,
      total_income REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
  },
  {
    name: "002_create_budget_groups",
    up: `CREATE TABLE IF NOT EXISTS budget_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      allocated_budget REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE
    );`,
  },
  {
    name: "003_create_categories",
    up: `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      allocated_budget REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES budget_groups(id) ON DELETE CASCADE
    );`,
  },
  {
    name: "004_create_transactions",
    up: `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );`,
  },
  {
    name: "005_create_years",
    up: `CREATE TABLE IF NOT EXISTS years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
  },
  {
    name: "006_add_year_id_to_months",
    up: `ALTER TABLE months ADD COLUMN year_id INTEGER DEFAULT NULL;`,
  },
  {
    name: "007_backfill_year_id",
    up: `
      INSERT OR IGNORE INTO years (name) VALUES ('2026');
      UPDATE months SET year_id = (SELECT id FROM years WHERE name = '2026') WHERE year_id IS NULL;
    `,
  },
] as const;
