import { Hono } from "hono";
import { categoryController } from "../controllers/categoryController.js";

const categoriesRouter = new Hono();

categoriesRouter.get("/group/:groupId", categoryController.listByGroup);
categoriesRouter.get("/:id", categoryController.getById);
categoriesRouter.post("/", categoryController.create);
categoriesRouter.put("/:id", categoryController.update);
categoriesRouter.delete("/:id", categoryController.delete);

export default categoriesRouter;
