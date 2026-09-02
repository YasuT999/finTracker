import { Hono } from "hono";
import { yearController } from "../controllers/yearController.js";

const yearsRouter = new Hono();

yearsRouter.get("/", yearController.list);
yearsRouter.get("/:id/data", yearController.exportData);
yearsRouter.post("/", yearController.create);
yearsRouter.delete("/:id", yearController.delete);

export default yearsRouter;
