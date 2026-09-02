import { getDb, saveDb } from "./db.js";
function toRows(result) {
    if (!result || !result.length)
        return [];
    const columns = result[0].columns;
    return result[0].values.map((row) => {
        const obj = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });
        return obj;
    });
}
export async function query(sql, params = []) {
    const db = await getDb();
    const result = db.exec(sql, params);
    return toRows(result);
}
export async function first(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}
export async function execute(sql, params = []) {
    const db = await getDb();
    db.run(sql, params);
    const result = db.exec("SELECT last_insert_rowid() as id, changes() as changes");
    saveDb();
    const row = toRows(result)[0];
    return {
        changes: row?.changes || 0,
        lastInsertRowid: row?.id || 0,
    };
}
export async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
    const result = await execute(sql, values);
    return result.lastInsertRowid;
}
export async function update(table, data, where) {
    const keys = Object.keys(data);
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const values = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
    const whereValues = Object.values(where);
    const sql = `UPDATE ${table} SET ${sets} WHERE ${whereClauses}`;
    await execute(sql, [...values, ...whereValues]);
}
export async function remove(table, where) {
    const whereKeys = Object.keys(where);
    const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
    const values = Object.values(where);
    const sql = `DELETE FROM ${table} WHERE ${whereClauses}`;
    await execute(sql, values);
}
export async function increment(table, column, amount, where) {
    const whereKeys = Object.keys(where);
    const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
    const values = Object.values(where);
    const sql = `UPDATE ${table} SET ${column} = ${column} + ? WHERE ${whereClauses}`;
    await execute(sql, [amount, ...values]);
}
export async function decrement(table, column, amount, where) {
    const whereKeys = Object.keys(where);
    const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
    const values = Object.values(where);
    const sql = `UPDATE ${table} SET ${column} = ${column} - ? WHERE ${whereClauses}`;
    await execute(sql, [amount, ...values]);
}
const MIGRATIONS = [
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
];
export async function runMigrations() {
    await getDb();
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    run_at TEXT DEFAULT (datetime('now'))
  );`);
    saveDb();
    const existingRows = await query("SELECT name FROM _migrations");
    const runNames = new Set(existingRows.map((r) => r.name));
    for (const m of MIGRATIONS) {
        if (!runNames.has(m.name)) {
            console.log(`Running migration: ${m.name}`);
            await execute(m.up);
            await insert("_migrations", { name: m.name });
        }
    }
}
//# sourceMappingURL=query.js.map