import * as SQLite from "expo-sqlite";
import { pct } from "./format";
import type {
  BudgetGroup,
  Category,
  DashboardSummary,
  GroupWithUtilization,
  CategorySummary,
  Month,
  MonthSummary,
  Transaction,
  Year,
} from "./types";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const d = await SQLite.openDatabaseAsync("finance.db");
    await d.execAsync("PRAGMA journal_mode = WAL;");
    await d.execAsync("PRAGMA foreign_keys = ON;");
    await d.execAsync(`
      CREATE TABLE IF NOT EXISTS years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS months (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_id INTEGER DEFAULT NULL REFERENCES years(id) ON DELETE CASCADE,
        name TEXT NOT NULL UNIQUE,
        total_budget REAL DEFAULT 0,
        total_income REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS budget_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        allocated_budget REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL REFERENCES budget_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        allocated_budget REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT);
      CREATE INDEX IF NOT EXISTS idx_months_year ON months(year_id);
      CREATE INDEX IF NOT EXISTS idx_groups_month ON budget_groups(month_id);
      CREATE INDEX IF NOT EXISTS idx_cat_group ON categories(group_id);
      CREATE INDEX IF NOT EXISTS idx_txn_cat ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
    `);
    // idempotent: old DBs may lack months.year_id
    try {
      await d.execAsync("ALTER TABLE months ADD COLUMN year_id INTEGER DEFAULT NULL;");
    } catch {
      // column already exists — ignore
    }
    db = d;
    initPromise = null;
    return d;
  })();
  return initPromise;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  return initDb();
}

function friendly(e: unknown): never {
  const msg = String((e as Error)?.message ?? e);
  if (msg.includes("UNIQUE constraint failed")) {
    if (msg.includes("years.name")) throw new Error("Year already exists");
    if (msg.includes("months.name")) throw new Error("Month already exists");
    throw new Error("Duplicate name");
  }
  throw e instanceof Error ? e : new Error(msg);
}

// ---------- years ----------
export async function listYears(): Promise<Year[]> {
  const d = await getDb();
  return d.getAllAsync<Year>("SELECT * FROM years ORDER BY name DESC");
}

export async function createYear(name: string): Promise<number> {
  const d = await getDb();
  try {
    const r = await d.runAsync("INSERT INTO years (name) VALUES (?)", [name.trim()]);
    return r.lastInsertRowId;
  } catch (e) {
    friendly(e);
  }
}

export async function deleteYear(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM years WHERE id = ?", [id]);
}

// ---------- months ----------
export async function listMonths(yearId: number, limit: number, offset: number): Promise<Month[]> {
  const d = await getDb();
  return d.getAllAsync<Month>(
    "SELECT * FROM months WHERE year_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
    [yearId, limit, offset]
  );
}

export async function createMonth(yearId: number, name: string, totalBudget: number): Promise<number> {
  const d = await getDb();
  try {
    const r = await d.runAsync(
      "INSERT INTO months (year_id, name, total_budget) VALUES (?, ?, ?)",
      [yearId, name.trim(), totalBudget || 0]
    );
    return r.lastInsertRowId;
  } catch (e) {
    friendly(e);
  }
}

export async function deleteMonth(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM months WHERE id = ?", [id]);
}

export async function getMonthSummary(monthId: number): Promise<MonthSummary | null> {
  const d = await getDb();
  const row = await d.getFirstAsync<Month & { total_expenses: number; total_txn_income: number }>(
    `SELECT m.*,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        WHERE g.month_id = m.id AND t.type = 'expense'), 0) AS total_expenses,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        WHERE g.month_id = m.id AND t.type = 'income'), 0) AS total_txn_income
     FROM months m WHERE m.id = ?`,
    [monthId]
  );
  if (!row) return null;
  const income = (row.total_income || 0) + (row.total_txn_income || 0);
  const remaining = (row.total_budget || 0) - row.total_expenses;
  return {
    ...row,
    total_income: income,
    remaining_budget: remaining,
    savings: income - row.total_expenses,
    utilization_percentage: pct(row.total_expenses, row.total_budget),
  };
}

// ---------- groups ----------
export async function listGroups(monthId: number): Promise<GroupWithUtilization[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<BudgetGroup & { actual_spending: number }>(
    `SELECT g.*,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE c.group_id = g.id AND t.type = 'expense'), 0) AS actual_spending
     FROM budget_groups g WHERE g.month_id = ? ORDER BY g.id ASC`,
    [monthId]
  );
  return rows.map((g) => ({
    ...g,
    remaining_budget: g.allocated_budget - g.actual_spending,
    utilization_percentage: pct(g.actual_spending, g.allocated_budget),
  }));
}

export async function getGroup(groupId: number): Promise<BudgetGroup | null> {
  const d = await getDb();
  return d.getFirstAsync<BudgetGroup>("SELECT * FROM budget_groups WHERE id = ?", [groupId]);
}

export async function createGroup(monthId: number, name: string, budget: number): Promise<number> {
  const d = await getDb();
  const r = await d.runAsync(
    "INSERT INTO budget_groups (month_id, name, allocated_budget) VALUES (?, ?, ?)",
    [monthId, name.trim(), budget || 0]
  );
  return r.lastInsertRowId;
}

export async function deleteGroup(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM budget_groups WHERE id = ?", [id]);
}

// ---------- categories ----------
export async function listCategories(groupId: number): Promise<CategorySummary[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<Category & { actual_spending: number }>(
    `SELECT c.*,
      COALESCE((SELECT SUM(amount) FROM transactions WHERE category_id = c.id AND type = 'expense'), 0) AS actual_spending
     FROM categories c WHERE c.group_id = ? ORDER BY c.id ASC`,
    [groupId]
  );
  return rows.map((c) => ({
    ...c,
    remaining_budget: c.allocated_budget - c.actual_spending,
    utilization_percentage: pct(c.actual_spending, c.allocated_budget),
  }));
}

export async function createCategory(groupId: number, name: string, budget: number): Promise<number> {
  const d = await getDb();
  const r = await d.runAsync(
    "INSERT INTO categories (group_id, name, allocated_budget) VALUES (?, ?, ?)",
    [groupId, name.trim(), budget || 0]
  );
  return r.lastInsertRowId;
}

export async function deleteCategory(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM categories WHERE id = ?", [id]);
}

export async function getCategorySummary(categoryId: number): Promise<CategorySummary | null> {
  const d = await getDb();
  const row = await d.getFirstAsync<Category & { actual_spending: number }>(
    `SELECT c.*,
      COALESCE((SELECT SUM(amount) FROM transactions WHERE category_id = c.id AND type = 'expense'), 0) AS actual_spending
     FROM categories c WHERE c.id = ?`,
    [categoryId]
  );
  if (!row) return null;
  return {
    ...row,
    remaining_budget: row.allocated_budget - row.actual_spending,
    utilization_percentage: pct(row.actual_spending, row.allocated_budget),
  };
}

// ---------- transactions (paginated — the list-lag fix) ----------
export async function listTransactions(
  categoryId: number,
  limit: number,
  offset: number
): Promise<Transaction[]> {
  const d = await getDb();
  return d.getAllAsync<Transaction>(
    "SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC, id DESC LIMIT ? OFFSET ?",
    [categoryId, limit, offset]
  );
}

export async function countTransactions(categoryId: number): Promise<number> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?",
    [categoryId]
  );
  return r?.n ?? 0;
}

export async function createTransaction(
  categoryId: number,
  amount: number,
  type: "income" | "expense",
  description: string,
  date: string
): Promise<number> {
  if (!amount || amount <= 0) throw new Error("Amount must be > 0");
  if (!description.trim()) throw new Error("Description required");
  const d = await getDb();
  const r = await d.runAsync(
    "INSERT INTO transactions (category_id, amount, type, description, date) VALUES (?, ?, ?, ?, ?)",
    [categoryId, amount, type, description.trim(), date]
  );
  return r.lastInsertRowId;
}

export async function deleteTransaction(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

// ---------- dashboard (all aggregates in SQL) ----------
export async function dashboardSummary(): Promise<DashboardSummary> {
  const d = await getDb();
  const counts = await d.getFirstAsync<{ yc: number; mc: number; tc: number }>(
    `SELECT (SELECT COUNT(*) FROM years) AS yc,
            (SELECT COUNT(*) FROM months) AS mc,
            (SELECT COUNT(*) FROM transactions) AS tc`
  );
  const per = await d.getAllAsync<{ name: string; amount: number; budget: number }>(
    `SELECT m.name,
       COALESCE((SELECT SUM(t.amount) FROM transactions t
         JOIN categories c ON c.id = t.category_id
         JOIN budget_groups g ON g.id = c.group_id
         WHERE g.month_id = m.id AND t.type = 'expense'), 0) AS amount,
       m.total_budget AS budget
     FROM months m`
  );
  const total = per.reduce((s, r) => s + r.amount, 0);
  const sorted = [...per].sort((a, b) => b.amount - a.amount);
  return {
    year_count: counts?.yc ?? 0,
    month_count: counts?.mc ?? 0,
    total_transactions: counts?.tc ?? 0,
    avg_monthly_spending: per.length ? total / per.length : 0,
    highest_spend_month: sorted[0] ? { name: sorted[0].name, amount: sorted[0].amount } : null,
    lowest_spend_month: sorted.length ? { name: sorted[sorted.length - 1].name, amount: sorted[sorted.length - 1].amount } : null,
    months_over_budget: per.filter((r) => r.amount > r.budget && r.budget > 0).length,
  };
}

// ---------- export (CSV string; file IO stays in screen layer) ----------
export async function categoryCsv(categoryId: number): Promise<string> {
  const d = await getDb();
  const rows = await d.getAllAsync<Transaction>(
    "SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC, id DESC LIMIT 5000",
    [categoryId]
  );
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ["id,amount,type,description,date"];
  for (const t of rows) lines.push(`${t.id},${t.amount},${t.type},${esc(t.description)},${t.date}`);
  return lines.join("\n");
}

// ---------- settings (currency symbol) ----------
export async function getCurrency(): Promise<string> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ value: string }>("SELECT value FROM _meta WHERE key = 'currency'");
  return r?.value ?? "$";
}

export async function setCurrency(symbol: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("INSERT OR REPLACE INTO _meta (key, value) VALUES ('currency', ?)", [symbol]);
}

// ---------- profile (onboarding form + photo; offline-only) ----------
export interface Profile {
  name: string;
  age: string;
  gender: string;
  email: string;
  mobile: string;
}

export async function getProfile(): Promise<Profile | null> {
  const raw = await getSetting("profile");
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Profile>;
    if (p && typeof p.name === "string" && p.name.trim()) {
      return {
        name: p.name,
        age: String(p.age ?? ""),
        gender: String(p.gender ?? ""),
        email: String(p.email ?? ""),
        mobile: String(p.mobile ?? ""),
      };
    }
  } catch {
    // legacy installs stored a plain name string — fall through
  }
  const name = raw.trim();
  return name ? { name, age: "", gender: "", email: "", mobile: "" } : null;
}

export async function setProfile(p: Profile): Promise<void> {
  await setSetting("profile", JSON.stringify(p));
}

export async function clearProfile(): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM _meta WHERE key IN ('profile', 'profile_photo')");
}

export async function getProfilePhoto(): Promise<string | null> {
  return getSetting("profile_photo");
}

export async function setProfilePhoto(uri: string): Promise<void> {
  await setSetting("profile_photo", uri);
}

export const MAX_PHOTO_BYTES = 1024 * 1024;

// ---------- generic settings (theme, onboarding, profile) ----------
export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ value: string }>("SELECT value FROM _meta WHERE key = ?", [key]);
  return r?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)", [key, value]);
}

// ---------- years with stats (months count + saved) ----------
export interface YearStat {
  id: number;
  name: string;
  months: number;
  saved: number;
}

export async function yearStats(): Promise<YearStat[]> {
  const d = await getDb();
  return d.getAllAsync<YearStat>(
    `SELECT y.id, y.name,
      (SELECT COUNT(*) FROM months m WHERE m.year_id = y.id) AS months,
      COALESCE((SELECT SUM(m2.total_income) FROM months m2 WHERE m2.year_id = y.id), 0) +
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        JOIN months m3 ON m3.id = g.month_id
        WHERE m3.year_id = y.id AND t.type = 'income'), 0) -
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        JOIN months m4 ON m4.id = g.month_id
        WHERE m4.year_id = y.id AND t.type = 'expense'), 0) AS saved
     FROM years y ORDER BY y.name DESC`
  );
}

// ---------- months of a year with net balance (for grid + mini chart) ----------
export interface MonthNet extends Month {
  spent: number;
  income: number;
  net: number;
}

export async function listMonthsWithNet(yearId: number): Promise<MonthNet[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<Month & { spent: number; txn_income: number }>(
    `SELECT m.*,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        WHERE g.month_id = m.id AND t.type = 'expense'), 0) AS spent,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        WHERE g.month_id = m.id AND t.type = 'income'), 0) AS txn_income
     FROM months m WHERE m.year_id = ? ORDER BY m.id ASC`,
    [yearId]
  );
  return rows.map((m) => {
    const income = (m.total_income || 0) + (m.txn_income || 0);
    return { ...m, spent: m.spent, income, net: income - m.spent };
  });
}

// ---------- group-level transactions (filterable, paginated) ----------
export interface GroupTxn extends Transaction {
  category: string;
}

export async function listGroupTxns(
  groupId: number,
  type: "all" | "income" | "expense",
  limit: number,
  offset: number
): Promise<GroupTxn[]> {
  const d = await getDb();
  const filt = type === "all" ? "" : "AND t.type = ?";
  const params: (string | number)[] = type === "all" ? [groupId] : [groupId, type];
  return d.getAllAsync<GroupTxn>(
    `SELECT t.*, c.name AS category FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE c.group_id = ? ${filt}
     ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
}

export async function countGroupTxns(groupId: number, type: "all" | "income" | "expense"): Promise<number> {
  const d = await getDb();
  const filt = type === "all" ? "" : "AND t.type = ?";
  const params: (string | number)[] = type === "all" ? [groupId] : [groupId, type];
  const r = await d.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE c.group_id = ? ${filt}`,
    params
  );
  return r?.n ?? 0;
}

export async function recentMonthTxns(monthId: number, limit: number): Promise<GroupTxn[]> {
  const d = await getDb();
  return d.getAllAsync<GroupTxn>(
    `SELECT t.*, c.name AS category FROM transactions t
     JOIN categories c ON c.id = t.category_id
     JOIN budget_groups g ON g.id = c.group_id
     WHERE g.month_id = ? ORDER BY t.date DESC, t.id DESC LIMIT ?`,
    [monthId, limit]
  );
}

// ---------- reports ----------
export interface MonthTotal {
  id: number;
  name: string;
  spent: number;
  budget: number;
}

export async function monthlyTotals(): Promise<MonthTotal[]> {
  const d = await getDb();
  return d.getAllAsync<MonthTotal>(
    `SELECT m.id, m.name, m.total_budget AS budget,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        JOIN budget_groups g ON g.id = c.group_id
        WHERE g.month_id = m.id AND t.type = 'expense'), 0) AS spent
     FROM months m ORDER BY m.id ASC`
  );
}

export async function spendByGroup(monthId?: number): Promise<{ name: string; amount: number }[]> {
  const d = await getDb();
  const filt = monthId == null ? "" : "WHERE g.month_id = ?";
  const params: (string | number)[] = monthId == null ? [] : [monthId];
  return d.getAllAsync<{ name: string; amount: number }>(
    `SELECT g.name,
      COALESCE((SELECT SUM(t.amount) FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE c.group_id = g.id AND t.type = 'expense'), 0) AS amount
     FROM budget_groups g ${filt} ORDER BY amount DESC`,
    params
  );
}
