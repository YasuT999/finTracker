import type { Context } from "hono";
import { transactionService } from "../services/transactionService.js";
import { validateTransactionInput } from "../validators/index.js";

export const transactionController = {
  async listByCategory(c: Context) {
    const categoryId = Number(c.req.param("categoryId"));
    if (isNaN(categoryId)) return c.json({ error: "Invalid categoryId" }, 400);

    const transactions = await transactionService.listByCategory(categoryId);
    return c.json(transactions);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const errors = validateTransactionInput(body);
    if (errors.length > 0) return c.json({ errors }, 400);

    try {
      const transaction = await transactionService.create({
        category_id: body.category_id,
        amount: Number(body.amount),
        type: body.type,
        description: body.description,
        date: body.date,
      });
      return c.json(transaction, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async update(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json();
    try {
      const transaction = await transactionService.update(id, {
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        type: body.type,
        description: body.description,
        date: body.date,
      });
      return c.json(transaction);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },

  async delete(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    try {
      await transactionService.delete(id);
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status || 500);
    }
  },
};
