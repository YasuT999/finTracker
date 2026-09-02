import { Hono } from "hono";
import { cors } from "hono/cors";
import yearsRouter from "./routes/years.js";
import monthsRouter from "./routes/months.js";
import groupsRouter from "./routes/groups.js";
import categoriesRouter from "./routes/categories.js";
import transactionsRouter from "./routes/transactions.js";
import dataRouter from "./routes/data.js";
import { dashboardController } from "./controllers/dashboardController.js";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => c.json({ status: "ok", version: "1.0.0" }));
app.get("/api/dashboard/summary", dashboardController.summary);

app.route("/api/years", yearsRouter);
app.route("/api/months", monthsRouter);
app.route("/api/groups", groupsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/transactions", transactionsRouter);
app.route("/api/data", dataRouter);

export default app;
