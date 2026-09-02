import { Hono } from "hono";
import { monthController } from "../controllers/monthController.js";

const monthsRouter = new Hono();

monthsRouter.get("/", monthController.list);
monthsRouter.get("/:id", monthController.getById);
monthsRouter.post("/", monthController.create);
monthsRouter.put("/:id", monthController.update);
monthsRouter.delete("/:id", monthController.delete);
monthsRouter.post("/:id/copy", monthController.copy);

export default monthsRouter;
