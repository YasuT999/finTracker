import type { Context } from "hono";
import { groupService } from "../services/groupService.js";
import { validateGroupInput } from "../validators/index.js";

export const groupController = {
  async listByMonth(c: Context) {
    const monthId = Number(c.req.param("monthId"));
    if (isNaN(monthId)) return c.json({ error: "Invalid monthId" }, 400);

    const groups = await groupService.listByMonth(monthId);
    return c.json(groups);
  },

  async getById(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const group = await groupService.getDetail(id);
    if (!group) return c.json({ error: "Group not found" }, 404);
    return c.json(group);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const errors = validateGroupInput(body);
    if (errors.length > 0) return c.json({ errors }, 400);

    const group = await groupService.create({
      month_id: body.month_id,
      name: body.name,
      allocated_budget: Number(body.allocated_budget) || 0,
    });
    return c.json(group, 201);
  },

  async update(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json();
    try {
      const group = await groupService.update(id, {
        name: body.name,
        allocated_budget: body.allocated_budget !== undefined ? Number(body.allocated_budget) : undefined,
      });
      return c.json(group);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    await groupService.delete(id);
    return c.json({ success: true });
  },
};
