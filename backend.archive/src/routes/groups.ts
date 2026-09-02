import { Hono } from "hono";
import { groupController } from "../controllers/groupController.js";

const groupsRouter = new Hono();

groupsRouter.get("/month/:monthId", groupController.listByMonth);
groupsRouter.get("/:id", groupController.getById);
groupsRouter.post("/", groupController.create);
groupsRouter.put("/:id", groupController.update);
groupsRouter.delete("/:id", groupController.delete);

export default groupsRouter;
