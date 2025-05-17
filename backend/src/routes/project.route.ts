import { zValidator } from '@hono/zod-validator';
import fp from 'lodash/fp';
import dayjs from 'dayjs';
import db from 'db/db';
import { ProjectTable, ProjectAssignmentTable } from 'db/schema';
import { Hono } from 'hono';
import { get } from 'lodash';
import { ulid } from 'ulid';
import { z } from 'zod';
import { eq, isNull, and, desc, inArray } from 'drizzle-orm';
import CreateOrUpdateFile from 'lib/Github/CreateOrUpdateFile';
import { DeleteProjectDirectory } from '../lib/Github/DeleteProjectDirectory';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';
import CheckProjectAccess from '@middlewars/CheckProjectAccess';
import { fetchStaffUsersFromKeycloak } from '../lib/Keycloak/admin-api';
import { logActivity, ACTIVITY_TYPES } from '../lib/ActivityLogger';

const ProjectRoute = new Hono();

ProjectRoute.get('/', CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]), async (ctx) => {
  try {
    const user = ctx.get('user');

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
        return ctx.json({ projects: [] });
      }

      projects = await db
        .select()
        .from(ProjectTable)
        .where(and(isNull(ProjectTable.deletedAt), inArray(ProjectTable.id, projectIds)))
        .orderBy(desc(ProjectTable.id))
        .execute();
    } else {
      projects = await db
        .select()
        .from(ProjectTable)
        .where(isNull(ProjectTable.deletedAt))
        .orderBy(desc(ProjectTable.id))
        .execute();
    }

    return ctx.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ctx.json({ message: 'Failed to fetch projects', error: errorMessage }, 500);
  }
});

ProjectRoute.get(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  async (ctx) => {
    try {
      const id = ctx.req.param('id');

      const project = await db.query.ProjectTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, id),
        with: {
          listTestSuite: {
            where: (clm, { isNull }) => isNull(clm.deletedAt),
            orderBy: (clm, { desc }) => desc(clm.id),
          },
        },
      });

      if (!project) {
        return ctx.json({ message: 'Project not found' }, 404);
      }
      const listTestSuiteId = project.listTestSuite.map((i) => i.id);
      const listTestSuiteExecute = await db.query.TestSuiteExecuteTable.findMany({
        where: (clm, { inArray }) => inArray(clm.testSuiteId, listTestSuiteId),
        orderBy: (clm, { desc }) => desc(clm.id),
        limit: 24,
      });

      return ctx.json({
        project: {
          ...project,
          recentTestRun: listTestSuiteExecute.map((item) => {
            const testSuite = project.listTestSuite.find(fp.isMatch({ id: item.testSuiteId }));
            return {
              id: item.id,
              reportUrl: get(item?.params, 'resultRunner.reportUrl'),
              testSuiteName: testSuite?.name,
              status: item.status,
              createdAt: item.createdAt,
              createdBy: item.createdBy,
            };
          }),
        },
      });
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ctx.json({ message: 'Failed to fetch project', error: errorMessage }, 500);
    }
  }
);

ProjectRoute.post(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    'json',
    z.object({
      title: z.string(),
      description: z.string().optional(),
    })
  ),
  async (ctx) => {
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const project = await db
      .insert(ProjectTable)
      .values({
        createdAt: dayjs().toISOString(),
        description: body.description,
        id: ulid(),
        title: body.title,
        createdBy: user.email,
      })
      .returning()
      .then((res) => res[0]);

    if (project.slug) {
      const fileContent = '*** Settings ***';
      const fileName = 'resources/init.robot';

      try {
        CreateOrUpdateFile({
          projectSlug: project.slug,
          fileContent: fileContent,
          fileName: fileName,
        });
      } catch (error) {
        console.log(error, 'Create project error');
      }
    }

    await logActivity(
      ACTIVITY_TYPES.PROJECT_CREATED,
      project.id,
      user.email,
      `Created project "${project.title}"`,
      project.id,
      'project'
    );

    return ctx.json({ message: 'ok' });
  }
);

ProjectRoute.patch(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  CheckProjectAccess(),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator(
    'json',
    z.object({
      title: z.string(),
      description: z.string().optional(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const body = ctx.req.valid('json');
    const user = ctx.get('user');
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });
    if (!project) {
      return ctx.json(
        {
          message: 'Không tìm thấy thông tin Project theo mã ID',
          code: 'NOT_FOUND',
        },
        404
      );
    }
    await db
      .update(ProjectTable)
      .set({
        title: body.title,
        description: body.description,
      })
      .where(eq(ProjectTable.id, project.id));

    await logActivity(
      ACTIVITY_TYPES.PROJECT_UPDATED,
      project.id,
      user.email,
      `Updated project "${body.title}"`,
      project.id,
      'project',
      {
        previousTitle: project.title,
        newTitle: body.title,
        previousDescription: project.description,
        newDescription: body.description,
      }
    );

    return ctx.json({ message: 'ok' });
  }
);

ProjectRoute.delete(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  CheckProjectAccess(),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.valid('param');

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }

    if (project.slug) {
      try {
        await DeleteProjectDirectory(project.slug);
      } catch (error) {
        console.error('Error deleting project GitHub resources:', error);
      }
    }

    const result = await db
      .update(ProjectTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(ProjectTable.id, id))
      .returning();

    await logActivity(
      ACTIVITY_TYPES.PROJECT_DELETED,
      id,
      user.email,
      `Deleted project "${project.title}"`,
      id,
      'project'
    );

    return ctx.json({ message: 'ok' });
  }
);

ProjectRoute.post(
  '/:id/assignments',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator(
    'json',
    z.object({
      userEmail: z.string().email(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const { userEmail } = ctx.req.valid('json');
    const user = ctx.get('user');

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq, isNull, and }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }

    const existingAssignment = await db.query.ProjectAssignmentTable.findFirst({
      where: (clm, { eq, and, isNull }) =>
        and(eq(clm.projectId, id), eq(clm.userEmail, userEmail), isNull(clm.deletedAt)),
    });

    if (existingAssignment) {
      return ctx.json({ message: 'User is already assigned to this project' }, 400);
    }

    await db.insert(ProjectAssignmentTable).values({
      id: ulid(),
      projectId: project.id,
      userEmail: userEmail,
      createdAt: dayjs().toISOString(),
      createdBy: user.email,
    });

    await logActivity(
      ACTIVITY_TYPES.PROJECT_STAFF_ADDED,
      project.id,
      user.email,
      `Assigned user ${userEmail} to project "${project.title}"`,
      project.id,
      'project',
      { assignedUser: userEmail }
    );

    return ctx.json({ message: 'User assigned to project successfully' });
  }
);

ProjectRoute.delete(
  '/:id/assignments/:userEmail',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
      userEmail: z.string().email(),
    })
  ),
  async (ctx) => {
    const { id, userEmail } = ctx.req.valid('param');
    const user = ctx.get('user');

    const assignment = await db.query.ProjectAssignmentTable.findFirst({
      where: (clm, { eq, and, isNull }) =>
        and(eq(clm.projectId, id), eq(clm.userEmail, userEmail), isNull(clm.deletedAt)),
    });

    if (!assignment) {
      return ctx.json({ message: 'Assignment not found' }, 404);
    }

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }

    await db
      .update(ProjectAssignmentTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(ProjectAssignmentTable.id, assignment.id));

    await logActivity(
      ACTIVITY_TYPES.PROJECT_STAFF_REMOVED,
      id,
      user.email,
      `Removed user ${userEmail} from project "${project.title}"`,
      id,
      'project',
      { removedUser: userEmail }
    );

    return ctx.json({ message: 'User assignment removed successfully' });
  }
);

ProjectRoute.get(
  '/:id/assignments',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid('param');

    const assignments = await db.query.ProjectAssignmentTable.findMany({
      where: (clm, { eq, isNull, and }) => and(eq(clm.projectId, id), isNull(clm.deletedAt)),
    });

    return ctx.json({ assignments });
  }
);

ProjectRoute.get(
  '/:id/available-staff',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    try {
      const { id } = ctx.req.valid('param');

      const project = await db.query.ProjectTable.findFirst({
        where: (clm, { eq, isNull, and }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
      });

      if (!project) {
        return ctx.json({ message: 'Project not found' }, 404);
      }

      const allStaffUsers = await fetchStaffUsersFromKeycloak();

      const assignments = await db.query.ProjectAssignmentTable.findMany({
        where: (clm, { eq, isNull, and }) => and(eq(clm.projectId, id), isNull(clm.deletedAt)),
      });

      const assignedEmails = assignments.map((a) => a.userEmail);

      const availableStaff = allStaffUsers.filter((user) => !assignedEmails.includes(user.email));

      return ctx.json({ availableStaff });
    } catch (error) {
      console.error('Error fetching available staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ctx.json({ message: 'Failed to fetch available staff', error: errorMessage }, 500);
    }
  }
);

export default ProjectRoute;
