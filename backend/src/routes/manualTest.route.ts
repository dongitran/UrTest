import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import db from 'db/db';
import { ManualTestCaseTable, BugTable } from 'db/schema';
import { eq, and, isNull, inArray, count, sql, desc as drizzleDesc } from 'drizzle-orm';
import dayjs from 'dayjs';
import fromNow from 'dayjs/plugin/relativeTime';
import { ulid } from 'ulid';
import * as ManualTestCaseSchema from 'lib/Zod/ManualTestCaseSchema';
import * as BugSchema from 'lib/Zod/BugSchema';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';
import CheckProjectAccess from '@middlewars/CheckProjectAccess';
import { logActivity, ACTIVITY_TYPES } from '../lib/ActivityLogger';

dayjs.extend(fromNow);

const ManualTestRoute = new Hono();

ManualTestRoute.get(
  '/stats',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('query', ManualTestCaseSchema.schemaForGetTestCases.pick({ projectId: true })),
  async (ctx) => {
    const { projectId } = ctx.req.valid('query');

    const testCases = await db.query.ManualTestCaseTable.findMany({
      where: (clm, { eq, and, isNull }) => and(eq(clm.projectId, projectId), isNull(clm.deletedAt)),
    });

    const stats = {
      totalTestCases: testCases.length,
      passed: testCases.filter((tc) => tc.status === 'Passed').length,
      failed: testCases.filter((tc) => tc.status === 'Failed').length,
      inProgress: testCases.filter((tc) => tc.status === 'In Progress').length,
      notStarted: testCases.filter((tc) => tc.status === 'Not Started').length,
      draft: testCases.filter((tc) => tc.status === 'Draft').length,
      activeBugs: testCases.filter((tc) => tc.bugStatusType === 'bug').length,
      progress:
        testCases.length > 0
          ? Math.round(
              (testCases.filter((tc) => tc.status === 'Passed').length / testCases.length) * 100
            )
          : 0,
    };

    return ctx.json(stats);
  }
);

ManualTestRoute.get(
  '/test-cases',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('query', ManualTestCaseSchema.schemaForGetTestCases),
  async (ctx) => {
    const query = ctx.req.valid('query');

    let conditions: any[] = [
      isNull(ManualTestCaseTable.deletedAt),
      eq(ManualTestCaseTable.projectId, query.projectId),
    ];

    if (query.status && query.status !== 'all') {
      const statusMap = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        passed: 'Passed',
        failed: 'Failed',
        draft: 'Draft',
      };
      conditions.push(eq(ManualTestCaseTable.status, statusMap[query.status] as any));
    }

    if (query.assignedTo) {
      conditions.push(eq(ManualTestCaseTable.assignedToEmail, query.assignedTo));
    }

    if (query.category) {
      conditions.push(eq(ManualTestCaseTable.category, query.category as any));
    }

    if (query.priority) {
      conditions.push(eq(ManualTestCaseTable.priority, query.priority as any));
    }

    const testCases = await db.query.ManualTestCaseTable.findMany({
      where: and(...conditions),
      orderBy: (clm, { desc }) => desc(clm.createdAt),
    });

    const transformedTestCases = testCases.map((tc) => ({
      id: tc.id,
      name: tc.name,
      category: getCategoryLabel(tc.category),
      priority: tc.priority,
      assignedTo: tc.assignedToEmail
        ? {
            name: tc.assignedTo || tc.assignedToEmail.split('@')[0],
            email: tc.assignedToEmail,
            avatar: null,
          }
        : null,
      status: tc.status,
      bugStatus: {
        type: tc.bugStatusType,
        reporter: tc.bugReporter,
        message: tc.bugMessage || getBugStatusMessage(tc.bugStatusType),
      },
      lastUpdated: tc.updatedAt
        ? dayjs(tc.updatedAt).fromNow()
        : tc.createdAt
          ? dayjs(tc.createdAt).fromNow()
          : 'Never',
      estimatedTime: tc.estimatedTime,
      description: tc.description,
      dueDate: tc.dueDate,
      tags: tc.tags || [],
      notes: tc.notes,
    }));

    return ctx.json(transformedTestCases);
  }
);

ManualTestRoute.get(
  '/test-cases/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', ManualTestCaseSchema.schemaForIdParam),
  async (ctx) => {
    const { id } = ctx.req.valid('param');

    const testCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testCase) {
      return ctx.json({ message: 'Test case not found' }, 404);
    }

    const responseTc = {
      ...testCase,
      assignedTo: testCase.assignedToEmail,
    };

    return ctx.json(responseTc);
  }
);

ManualTestRoute.post(
  '/test-cases',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('json', ManualTestCaseSchema.schemaForCreateTestCase),
  async (ctx) => {
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, body.projectId), isNull(clm.deletedAt)),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }

    const testCase = await db
      .insert(ManualTestCaseTable)
      .values({
        id: ulid(),
        projectId: body.projectId,
        name: body.name,
        category: body.category,
        priority: body.priority || 'Medium',
        estimatedTime: body.estimatedTime,
        description: body.description,
        assignedTo: body.assignedTo ? body.assignedTo.split('@')[0] : null,
        assignedToEmail: body.assignedTo,
        dueDate: body.dueDate,
        tags: body.tags,
        status: body.status || 'Not Started',
        createdAt: dayjs().toISOString(),
        createdBy: user.email,
      })
      .returning()
      .then((res) => res[0]);

    await logActivity(
      ACTIVITY_TYPES.MANUAL_TEST_CASE_CREATED,
      body.projectId,
      user.email,
      `Created manual test case "${body.name}"`,
      testCase.id,
      'manual_test_case'
    );

    return ctx.json(testCase);
  }
);

ManualTestRoute.patch(
  '/test-cases/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', ManualTestCaseSchema.schemaForIdParam),
  zValidator('json', ManualTestCaseSchema.schemaForUpdateTestCase),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const testCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testCase) {
      return ctx.json({ message: 'Test case not found' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testCase.createdBy === user.email;
    const isAssigned = testCase.assignedToEmail === user.email;

    if (isStaff && !isCreator && !isAssigned) {
      return ctx.json(
        {
          message:
            'Forbidden: Staff members can only update test cases they created or are assigned to',
        },
        403
      );
    }

    const updatePayload: Partial<typeof ManualTestCaseTable.$inferInsert> = {
      updatedAt: dayjs().toISOString(),
      updatedBy: user.email,
    };

    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.priority !== undefined) updatePayload.priority = body.priority;
    if (body.estimatedTime !== undefined) updatePayload.estimatedTime = body.estimatedTime;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.assignedTo !== undefined) {
      updatePayload.assignedTo = body.assignedTo ? body.assignedTo.split('@')[0] : null;
      updatePayload.assignedToEmail = body.assignedTo;
    }
    if (body.dueDate !== undefined) updatePayload.dueDate = body.dueDate;
    if (body.tags !== undefined) updatePayload.tags = body.tags;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const updatedTestCase = await db
      .update(ManualTestCaseTable)
      .set(updatePayload)
      .where(eq(ManualTestCaseTable.id, id))
      .returning()
      .then((res) => res[0]);

    await logActivity(
      ACTIVITY_TYPES.MANUAL_TEST_CASE_UPDATED,
      testCase.projectId,
      user.email,
      `Updated manual test case "${updatedTestCase.name}"`,
      testCase.id,
      'manual_test_case',
      {
        previousName: testCase.name,
        newName: updatedTestCase.name,
      }
    );

    return ctx.json(updatedTestCase);
  }
);

ManualTestRoute.delete(
  '/test-cases/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', ManualTestCaseSchema.schemaForIdParam),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');

    const testCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testCase) {
      return ctx.json({ message: 'Test case not found' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testCase.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message: 'Forbidden: Staff members can only delete test cases they created',
        },
        403
      );
    }

    await db
      .update(ManualTestCaseTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(ManualTestCaseTable.id, id));

    await logActivity(
      ACTIVITY_TYPES.MANUAL_TEST_CASE_DELETED,
      testCase.projectId,
      user.email,
      `Deleted manual test case "${testCase.name}"`,
      testCase.id,
      'manual_test_case'
    );

    return ctx.json({ message: 'Test case deleted successfully' });
  }
);

ManualTestRoute.post(
  '/test-cases/:id/execute',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', ManualTestCaseSchema.schemaForIdParam),
  zValidator('json', ManualTestCaseSchema.schemaForExecuteTestCase),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const testCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testCase) {
      return ctx.json({ message: 'Test case not found' }, 404);
    }

    const executionHistory = (testCase.executionHistory as any[]) || [];
    executionHistory.push({
      executedAt: dayjs().toISOString(),
      executedBy: user.email,
      status: body.status,
      notes: body.notes,
      executionTime: body.executionTime,
    });

    const updatedTestCase = await db
      .update(ManualTestCaseTable)
      .set({
        status: body.status,
        notes: body.notes,
        executionHistory,
        updatedAt: dayjs().toISOString(),
        updatedBy: user.email,
      })
      .where(eq(ManualTestCaseTable.id, id))
      .returning()
      .then((res) => res[0]);

    await logActivity(
      ACTIVITY_TYPES.MANUAL_TEST_CASE_EXECUTED,
      testCase.projectId,
      user.email,
      `Executed manual test case "${testCase.name}" with status: ${body.status}`,
      testCase.id,
      'manual_test_case',
      {
        status: body.status,
        notes: body.notes,
      }
    );

    return ctx.json(updatedTestCase);
  }
);

ManualTestRoute.patch(
  '/test-cases/:id/status',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', ManualTestCaseSchema.schemaForIdParam),
  zValidator('json', ManualTestCaseSchema.schemaForUpdateStatus),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const testCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testCase) {
      return ctx.json({ message: 'Test case not found' }, 404);
    }

    const updateData: any = {
      status: body.status,
      notes: body.notes,
      updatedAt: dayjs().toISOString(),
      updatedBy: user.email,
    };

    if (body.bugStatus) {
      updateData.bugStatusType = body.bugStatus.type;
      updateData.bugReporter = body.bugStatus.reporter || user.email;
      updateData.bugMessage = body.bugStatus.message;
    }

    const updatedTestCase = await db
      .update(ManualTestCaseTable)
      .set(updateData)
      .where(eq(ManualTestCaseTable.id, id))
      .returning()
      .then((res) => res[0]);

    return ctx.json(updatedTestCase);
  }
);

ManualTestRoute.post(
  '/test-cases/:testCaseId/bugs',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', BugSchema.schemaForTestCaseIdParam),
  zValidator('json', BugSchema.schemaForCreateBug),
  async (ctx) => {
    const { testCaseId } = ctx.req.valid('param');
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const manualTestCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, testCaseId), isNull(clm.deletedAt)),
    });

    if (!manualTestCase) {
      return ctx.json({ message: 'Manual Test Case not found' }, 404);
    }

    if (manualTestCase.projectId !== body.projectId) {
      return ctx.json({ message: 'Project ID mismatch with test case' }, 400);
    }

    const bug = await db
      .insert(BugTable)
      .values({
        id: ulid(),
        manualTestCaseId: testCaseId,
        projectId: body.projectId,
        title: body.title,
        description: body.description,
        severity: body.severity,
        priority: body.priority,
        status: 'Open',
        assignedToEmail: body.assignedToEmail,
        reporterEmail: user.email,
        createdAt: dayjs().toISOString(),
        createdBy: user.email,
      })
      .returning()
      .then((res) => res[0]);

    await logActivity(
      ACTIVITY_TYPES.BUG_CREATED,
      body.projectId,
      user.email,
      `Created bug "${bug.title}" for test case "${manualTestCase.name}"`,
      bug.id,
      'bug'
    );

    return ctx.json(bug, 201);
  }
);

ManualTestRoute.get(
  '/test-cases/:testCaseId/bugs',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', BugSchema.schemaForTestCaseIdParam),
  async (ctx) => {
    const { testCaseId } = ctx.req.valid('param');

    const manualTestCase = await db.query.ManualTestCaseTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, testCaseId), isNull(clm.deletedAt)),
    });

    if (!manualTestCase) {
      return ctx.json({ message: 'Manual Test Case not found, cannot fetch bugs.' }, 404);
    }

    const bugs = await db.query.BugTable.findMany({
      where: (clm, { eq, and, isNull }) =>
        and(eq(clm.manualTestCaseId, testCaseId), isNull(clm.deletedAt)),
      orderBy: (clm, { desc }) => drizzleDesc(clm.createdAt),
    });
    return ctx.json(bugs);
  }
);

function getCategoryLabel(category: string | null): string {
  if (!category) return 'Unknown';
  const categoryMap = {
    functional: 'Functional Test',
    ui: 'UI Test',
    integration: 'Integration Test',
    api: 'API Test',
    performance: 'Performance Test',
    security: 'Security Test',
  };
  return categoryMap[category] || category;
}

function getBugStatusMessage(type: string | null): string {
  if (!type) return 'Unknown';
  const messageMap = {
    none: 'No Issues',
    bug: 'Bug Found',
    fixed: 'Bug Fixed',
    testing: 'Testing',
    pending: 'Pending',
  };
  return messageMap[type] || 'Unknown';
}

export default ManualTestRoute;
