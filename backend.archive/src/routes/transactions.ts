import { Hono } from "hono";
import { transactionController } from "../controllers/transactionController.js";

const transactionsRouter = new Hono();

transactionsRouter.get("/category/:categoryId", transactionController.listByCategory);
transactionsRouter.post("/", transactionController.create);
transactionsRouter.put("/:id", transactionController.update);
transactionsRouter.delete("/:id", transactionController.delete);

export default transactionsRouter;
