import type { Context } from "hono";
import { dashboardService } from "../services/dashboardService.js";

export const dashboardController = {
  async summary(c: Context) {
    return c.json(await dashboardService.summary());
  },
};
