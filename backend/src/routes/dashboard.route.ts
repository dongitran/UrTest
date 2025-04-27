import { Hono } from "hono";

const DashboardRoute = new Hono();
DashboardRoute.get("/", async (ctx) => {
  return ctx.json({
    totalProject: 0,
    totalTestcase: 0,
    totalSuccessRate: 0,
    totalActive: 0,
  });
});
export default DashboardRoute;
