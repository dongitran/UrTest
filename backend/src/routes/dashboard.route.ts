import db from "db/db";
import { TestSuiteTable } from "db/schema";
import { count, isNull } from "drizzle-orm";
import { Hono } from "hono";

const DashboardRoute = new Hono();
DashboardRoute.get("/", async (ctx) => {
  const projects = await db.query.ProjectTable.findMany({
    where: (clm, { isNull }) => isNull(clm.deletedAt),
    orderBy: (clm, { desc }) => desc(clm.id),
    with: {
      listTestSuite: {
        where: (clm, { isNull }) => isNull(clm.deletedAt),
      },
    },
  });

  let totalTestsuite = 0;
  const dataTable = [];
  for (const item of projects) {
    if (item.listTestSuite.length > 0) {
      totalTestsuite += item.listTestSuite.length;
    }
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
    totalTestsuite,
    totalAvgSuccessRate: 0,
    totalActive: 0,
    dataTable,
  });
});
export default DashboardRoute;
