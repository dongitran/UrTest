import type { MiddlewareHandler } from 'hono';
import db from '../db/db';
import { ROLES } from './CheckPermission';

const CheckProjectAccess = (): MiddlewareHandler => {
  return async (ctx, next) => {
    const user = ctx.get('user');

    let projectId = ctx.req.query('projectId') || ctx.req.param('id');

    if (!projectId) {
      try {
        const body = await ctx.req.json();
        projectId = body.projectId;
      } catch (error) {}
    }

    if (!projectId) {
      await next();
      return;
    }

    const isAdminOrManager = user.roles.includes(ROLES.ADMIN) || user.roles.includes(ROLES.MANAGER);

    if (isAdminOrManager) {
      await next();
      return;
    }

    if (user.roles.includes(ROLES.STAFF)) {
      const assignment = await db.query.ProjectAssignmentTable.findFirst({
        where: (clm, { eq, and, isNull }) =>
          and(eq(clm.projectId, projectId), eq(clm.userEmail, user.email), isNull(clm.deletedAt)),
      });

      if (!assignment) {
        return ctx.json(
          {
            message: "Forbidden: You don't have access to this project",
          },
          403
        );
      }
    }

    await next();
  };
};

export default CheckProjectAccess;
