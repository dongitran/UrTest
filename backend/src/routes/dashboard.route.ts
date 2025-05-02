import db from 'db/db';
import { TestSuiteExecuteTable, TestSuiteTable } from 'db/schema';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';

const DashboardRoute = new Hono();

DashboardRoute.get('/', CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]), async (ctx) => {
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
