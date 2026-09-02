import * as q from "../libs/query.js";
import type { BudgetGroup, BudgetGroupCreate } from "../types/index.js";

export const groupRepository = {
  async findByMonth(monthId: number): Promise<BudgetGroup[]> {
    return q.query("SELECT * FROM budget_groups WHERE month_id = ?", [monthId]);
  },

  async findById(id: number): Promise<BudgetGroup | null> {
    return q.first("SELECT * FROM budget_groups WHERE id = ?", [id]);
  },

  async create(data: BudgetGroupCreate): Promise<BudgetGroup> {
    const id = await q.insert("budget_groups", data);
    return (await q.first("SELECT * FROM budget_groups WHERE id = ?", [id])) as BudgetGroup;
  },

  async update(id: number, data: Partial<BudgetGroupCreate>): Promise<BudgetGroup | null> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.allocated_budget !== undefined) updates.allocated_budget = data.allocated_budget;
    if (Object.keys(updates).length > 0) {
      await q.update("budget_groups", updates, { id });
    }
    return q.first("SELECT * FROM budget_groups WHERE id = ?", [id]);
  },

  async delete(id: number): Promise<void> {
    await q.remove("budget_groups", { id });
  },
};
