import type { Context } from "hono";
import { categoryService } from "../services/categoryService.js";
import { validateCategoryInput } from "../validators/index.js";

export const categoryController = {
  async listByGroup(c: Context) {
    const groupId = Number(c.req.param("groupId"));
    if (isNaN(groupId)) return c.json({ error: "Invalid groupId" }, 400);

    const categories = await categoryService.listByGroup(groupId);
    return c.json(categories);
  },

  async getById(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const detail = await categoryService.getDetail(id);
    if (!detail) return c.json({ error: "Category not found" }, 404);
    return c.json(detail);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const errors = validateCategoryInput(body);
    if (errors.length > 0) return c.json({ errors }, 400);

    const category = await categoryService.create({
      group_id: body.group_id,
      name: body.name,
      allocated_budget: Number(body.allocated_budget) || 0,
    });
    return c.json(category, 201);
  },

  async update(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json();
    try {
      const category = await categoryService.update(id, {
        name: body.name,
        allocated_budget: body.allocated_budget !== undefined ? Number(body.allocated_budget) : undefined,
      });
      return c.json(category);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    await categoryService.delete(id);
    return c.json({ success: true });
  },
};
