import db from "db/db";
import { TestSuiteExecuteTable } from "db/schema";
import { and, count, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import CheckPermission, { ROLES } from "@middlewars/CheckPermission";

const DashboardRoute = new Hono();

DashboardRoute.get(
  "/",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    const user = ctx.get("user");

    const isStaffOnly =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);

    let projects;
    if (isStaffOnly) {
      const assignments = await db.query.ProjectAssignmentTable.findMany({
        where: (clm, { eq, and, isNull }) =>
          and(eq(clm.userEmail, user.email), isNull(clm.deletedAt)),
      });

      const projectIds = assignments.map((a) => a.projectId);

      if (projectIds.length === 0) {
        return ctx.json({
          totalProject: 0,
          totalTestsuite: 0,
          totalAvgSuccessRate: 0,
          totalActive: 0,
          dataTable: [],
        });
      }

      projects = await db.query.ProjectTable.findMany({
        where: (clm, { isNull, and, inArray }) =>
          and(isNull(clm.deletedAt), inArray(clm.id, projectIds)),
        orderBy: (clm, { desc }) => desc(clm.id),
        with: {
          listTestSuite: {
            where: (clm, { isNull }) => isNull(clm.deletedAt),
          },
        },
      });
    } else {
      projects = await db.query.ProjectTable.findMany({
        where: (clm, { isNull }) => isNull(clm.deletedAt),
        orderBy: (clm, { desc }) => desc(clm.id),
        with: {
          listTestSuite: {
            where: (clm, { isNull }) => isNull(clm.deletedAt),
          },
        },
      });
    }

  let totalTestsuite = 0;
  const dataTable = [];
  for (const item of projects) {
    if (item.listTestSuite.length > 0) {
      totalTestsuite += item.listTestSuite.length;
    }
    let totalTestSuiteExecute = 0;
    const listTestSuiteId = item.listTestSuite.map((i) => i.id);
    if (listTestSuiteId.length) {
      totalTestSuiteExecute = await db
        .select({ count: count() })
        .from(TestSuiteExecuteTable)
        .where(
          and(
            inArray(TestSuiteExecuteTable.testSuiteId, listTestSuiteId),
            isNull(TestSuiteExecuteTable.deletedAt)
          )
        )
        .then((res) => res[0].count);
    }
    dataTable.push({
      id: item.id,
      title: item.title,
      description: item.description,
      status: 'Stable',
      updatedAt: item.updatedAt,
      totalTestSuite: item.listTestSuite.length,
      totalTestSuiteExecute,
      createdBy: item.createdBy,
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
