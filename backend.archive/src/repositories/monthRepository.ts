import * as q from "../libs/query.js";
import type { Month, MonthCreate } from "../types/index.js";

export const monthRepository = {
  async findAll(): Promise<Month[]> {
    return q.query("SELECT * FROM months ORDER BY created_at DESC");
  },

  async findByYear(yearId: number): Promise<Month[]> {
    return q.query("SELECT * FROM months WHERE year_id = ? ORDER BY created_at DESC", [yearId]);
  },

  async findById(id: number): Promise<Month | null> {
    return q.first("SELECT * FROM months WHERE id = ?", [id]);
  },

  async findByName(name: string): Promise<Month | null> {
    return q.first("SELECT id FROM months WHERE name = ?", [name]);
  },

  async create(data: MonthCreate): Promise<Month> {
    const id = await q.insert("months", data);
    return (await q.first("SELECT * FROM months WHERE id = ?", [id])) as Month;
  },

  async update(id: number, data: Partial<MonthCreate>): Promise<Month | null> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.total_budget !== undefined) updates.total_budget = data.total_budget;
    if (Object.keys(updates).length > 0) {
      await q.update("months", updates, { id });
    }
    return q.first("SELECT * FROM months WHERE id = ?", [id]);
  },

  async delete(id: number): Promise<void> {
    await q.remove("months", { id });
  },

  async incrementIncome(id: number, amount: number): Promise<void> {
    await q.increment("months", "total_income", amount, { id });
  },

  async decrementIncome(id: number, amount: number): Promise<void> {
    await q.decrement("months", "total_income", amount, { id });
  },
};
