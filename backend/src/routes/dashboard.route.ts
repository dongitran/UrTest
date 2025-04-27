import db from "db/db";
import { Hono } from "hono";

const DashboardRoute = new Hono();
DashboardRoute.get("/", async (ctx) => {
  const projects = await db.query.ProjectTable.findMany({
    where: (clm, { isNotNull }) => isNotNull(clm.deletedAt),
  });
  return ctx.json({
    totalProject: projects.length,
    totalTestcase: 0,
    totalAvgSuccessRate: 0,
    totalActive: 0,
  });
});
export default DashboardRoute;
