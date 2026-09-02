import { serve } from "@hono/node-server";
import app from "./app.js";
import { getDb } from "./libs/db.js";
import { runMigrations } from "./libs/query.js";

const port =  3001;

async function start() {
  await getDb();
  await runMigrations();
  console.log("Database ready");

  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`Server running on http://localhost:${port}`);
}

start().catch(console.error);
