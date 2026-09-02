import * as q from "../libs/query.js";
import type { Transaction, TransactionCreate } from "../types/index.js";

export const transactionRepository = {
  async findByCategory(categoryId: number): Promise<Transaction[]> {
    return q.query(
      "SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC",
      [categoryId]
    );
  },

  async findById(id: number): Promise<Transaction | null> {
    return q.first("SELECT * FROM transactions WHERE id = ?", [id]);
  },

  async create(data: TransactionCreate): Promise<Transaction> {
    const id = await q.insert("transactions", data);
    return (await q.first("SELECT * FROM transactions WHERE id = ?", [id])) as Transaction;
  },

  async update(id: number, data: Partial<TransactionCreate>): Promise<Transaction | null> {
    const updates: any = {};
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.type !== undefined) updates.type = data.type;
    if (data.description !== undefined) updates.description = data.description;
    if (data.date !== undefined) updates.date = data.date;
    if (Object.keys(updates).length > 0) {
      await q.update("transactions", updates, { id });
    }
    return q.first("SELECT * FROM transactions WHERE id = ?", [id]);
  },

  async delete(id: number): Promise<void> {
    await q.remove("transactions", { id });
  },

  async sumExpensesByCategory(categoryId: number): Promise<number> {
    const row = await q.first(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id = ? AND type = 'expense'",
      [categoryId]
    );
    return row?.total || 0;
  },

  async sumExpensesByCategories(categoryIds: number[]): Promise<number> {
    if (categoryIds.length === 0) return 0;
    const placeholders = categoryIds.map(() => "?").join(",");
    const row = await q.first(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id IN (${placeholders}) AND type = 'expense'`,
      categoryIds
    );
    return row?.total || 0;
  },
};
