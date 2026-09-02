import { getDb } from "./index";

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params);
}

export async function first<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<T>(sql, params);
  return row ?? null;
}

function toFriendlyError(e: any): never {
  const msg = String(e?.message ?? e);
  if (msg.includes("UNIQUE constraint failed")) {
    if (msg.includes("months.name")) throw Object.assign(new Error("Month already exists (name must be unique)"), { status: 400 });
    if (msg.includes("years.name")) throw Object.assign(new Error("Year already exists (name must be unique)"), { status: 400 });
    throw Object.assign(new Error("Duplicate entry — name must be unique"), { status: 400 });
  }
  if (msg.includes("CHECK constraint failed")) {
    throw Object.assign(new Error("Validation failed — check amount/type"), { status: 400 });
  }
  throw e;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ changes: number; lastInsertRowid: number }> {
  const db = await getDb();
  try {
    const result = await db.runAsync(sql, params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowId,
    };
  } catch (e) {
    toFriendlyError(e);
  }
}

export async function insert(table: string, data: Record<string, any>): Promise<number> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
  const result = await execute(sql, values);
  return result.lastInsertRowid;
}

export async function update(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<void> {
  const keys = Object.keys(data);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
  const whereValues = Object.values(where);
  const sql = `UPDATE ${table} SET ${sets} WHERE ${whereClauses}`;
  await execute(sql, [...values, ...whereValues]);
}

export async function remove(table: string, where: Record<string, any>): Promise<void> {
  const whereKeys = Object.keys(where);
  const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
  const values = Object.values(where);
  const sql = `DELETE FROM ${table} WHERE ${whereClauses}`;
  await execute(sql, values);
}

export async function increment(
  table: string,
  column: string,
  amount: number,
  where: Record<string, any>
): Promise<void> {
  const whereKeys = Object.keys(where);
  const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
  const values = Object.values(where);
  const sql = `UPDATE ${table} SET ${column} = ${column} + ? WHERE ${whereClauses}`;
  await execute(sql, [amount, ...values]);
}

export async function decrement(
  table: string,
  column: string,
  amount: number,
  where: Record<string, any>
): Promise<void> {
  const whereKeys = Object.keys(where);
  const whereClauses = whereKeys.map((k) => `${k} = ?`).join(" AND ");
  const values = Object.values(where);
  const sql = `UPDATE ${table} SET ${column} = ${column} - ? WHERE ${whereClauses}`;
  await execute(sql, [amount, ...values]);
}
