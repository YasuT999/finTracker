import * as q from "../libs/query.js";
import type { Category, CategoryCreate } from "../types/index.js";

export const categoryRepository = {
  async findByGroup(groupId: number): Promise<Category[]> {
    return q.query("SELECT * FROM categories WHERE group_id = ?", [groupId]);
  },

  async findById(id: number): Promise<Category | null> {
    return q.first("SELECT * FROM categories WHERE id = ?", [id]);
  },

  async create(data: CategoryCreate): Promise<Category> {
    const id = await q.insert("categories", data);
    return (await q.first("SELECT * FROM categories WHERE id = ?", [id])) as Category;
  },

  async update(id: number, data: Partial<CategoryCreate>): Promise<Category | null> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.allocated_budget !== undefined) updates.allocated_budget = data.allocated_budget;
    if (Object.keys(updates).length > 0) {
      await q.update("categories", updates, { id });
    }
    return q.first("SELECT * FROM categories WHERE id = ?", [id]);
  },

  async delete(id: number): Promise<void> {
    await q.remove("categories", { id });
  },
};
