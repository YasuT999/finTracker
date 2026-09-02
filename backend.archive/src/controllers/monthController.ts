import type { Context } from "hono";
import { monthService } from "../services/monthService.js";
import { validateMonthInput } from "../validators/index.js";

export const monthController = {
  async list(c: Context) {
    const yearId = c.req.query("year_id");
    const months = yearId
      ? await monthService.listByYear(Number(yearId))
      : await monthService.list();
    return c.json(months);
  },

  async getById(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const summary = await monthService.getSummary(id);
    if (!summary) return c.json({ error: "Month not found" }, 404);
    return c.json(summary);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const errors = validateMonthInput(body);
    if (errors.length > 0) return c.json({ errors }, 400);

    try {
      const month = await monthService.create({
        year_id: Number(body.year_id),
        name: body.name,
        total_budget: Number(body.total_budget) || 0,
      });
      return c.json(month, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async update(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json();
    try {
      const month = await monthService.update(id, {
        name: body.name,
        total_budget: body.total_budget !== undefined ? Number(body.total_budget) : undefined,
      });
      return c.json(month);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    await monthService.delete(id);
    return c.json({ success: true });
  },

  async copy(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json();
    if (!body.newMonthName) {
      return c.json({ error: "newMonthName is required" }, 400);
    }

    try {
      const month = await monthService.copy(id, body.newMonthName);
      return c.json(month, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },
};
