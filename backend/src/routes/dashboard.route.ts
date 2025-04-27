import db from "db/db";
import { Hono } from "hono";

const DashboardRoute = new Hono();
DashboardRoute.get("/", async (ctx) => {
  const projects = await db.query.ProjectTable.findMany({
    where: (clm, { isNull }) => isNull(clm.deletedAt),
    orderBy: (clm, { desc }) => desc(clm.id),
  });
  const dataTable = [];
  for (const item of projects) {
    dataTable.push({
      id: item.id,
      title: item.title,
      description: item.description,
      status: "Stable",
      updatedAt: item.updatedAt,
    });
  }
  return ctx.json({
    totalProject: projects.length,
    totalTestcase: 0,
    totalAvgSuccessRate: 0,
    totalActive: 0,
    dataTable,
  });
});
export default DashboardRoute;
