import { Hono } from "hono";
import { getDb, saveDb } from "../libs/db.js";

const router = new Hono();

router.post("/clear", async (c) => {
  const db = await getDb();
  db.run("DELETE FROM transactions");
  db.run("DELETE FROM categories");
  db.run("DELETE FROM budget_groups");
  db.run("DELETE FROM months");
  db.run("DELETE FROM years");
  saveDb();
  return c.json({ success: true });
});

export default router;
