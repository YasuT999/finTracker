import type { Context } from "hono";
import { yearService } from "../services/yearService.js";
import { validateYearInput } from "../validators/index.js";

export const yearController = {
  async list(c: Context) {
    const years = await yearService.list();
    return c.json(years);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const errors = validateYearInput(body);
    if (errors.length > 0) return c.json({ errors }, 400);

    try {
      const year = await yearService.create({ name: body.name });
      return c.json(year, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    await yearService.delete(id);
    return c.json({ success: true });
  },

  async exportData(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const data = await yearService.getData(id);
    if (!data) return c.json({ error: "Year not found" }, 404);
    return c.json(data);
  },
};
