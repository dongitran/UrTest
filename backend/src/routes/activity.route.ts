import { Hono } from 'hono';
import db from '../db/db';
import { ROLES } from '../middlewares/CheckPermission';
import CheckPermission from '../middlewares/CheckPermission';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, inArray, isNull, eq } from 'drizzle-orm';
import { ActivityLogTable } from '../db/schema';

const ActivityRoute = new Hono();

ActivityRoute.get(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator(
    'query',
    z.object({
      limit: z.string().optional(),
      projectId: z.string().optional(),
    })
  ),
  async (ctx) => {
    const user = ctx.get('user');
    const query = ctx.req.valid('query');
    const limit = parseInt(query.limit || '10', 10);
    const projectId = query.projectId;

    // ADMIN and MANAGER can see all activities
    if (user.roles.includes(ROLES.ADMIN) || user.roles.includes(ROLES.MANAGER)) {
      let whereConditions = [];

      // Add the isNull condition for deletedAt
      whereConditions.push(isNull(ActivityLogTable.deletedAt));

      if (projectId) {
        whereConditions.push(eq(ActivityLogTable.projectId, projectId));
      }

      const activities = await db.query.ActivityLogTable.findMany({
        where: and(...whereConditions),
        orderBy: (clm, { desc }) => desc(clm.createdAt),
        limit,
      });

      return ctx.json({ activities });
    }

    // STAFF can only see activities from assigned projects
    const assignments = await db.query.ProjectAssignmentTable.findMany({
      where: (clm, { eq, and, isNull }) =>
        and(eq(clm.userEmail, user.email), isNull(clm.deletedAt)),
    });

    const projectIds = assignments.map((a) => a.projectId);

    let whereConditions = [
      isNull(ActivityLogTable.deletedAt),
      inArray(ActivityLogTable.projectId, projectIds),
    ];

    if (projectId && projectIds.includes(projectId)) {
      whereConditions.push(eq(ActivityLogTable.projectId, projectId));
    }

    const activities = await db.query.ActivityLogTable.findMany({
      where: and(...whereConditions),
      orderBy: (clm, { desc }) => desc(clm.createdAt),
      limit,
    });

    return ctx.json({ activities });
  }
);

export default ActivityRoute;
