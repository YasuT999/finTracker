import * as q from "../libs/query.js";
import type { Year, YearCreate } from "../types/index.js";

export const yearRepository = {
  async findAll(): Promise<Year[]> {
    return q.query("SELECT * FROM years ORDER BY name DESC");
  },

  async findById(id: number): Promise<Year | null> {
    return q.first("SELECT * FROM years WHERE id = ?", [id]);
  },

  async findByName(name: string): Promise<Year | null> {
    return q.first("SELECT id FROM years WHERE name = ?", [name]);
  },

  async create(data: YearCreate): Promise<Year> {
    const id = await q.insert("years", data);
    return (await q.first("SELECT * FROM years WHERE id = ?", [id])) as Year;
  },

  async delete(id: number): Promise<void> {
    await q.remove("years", { id });
  },
};
