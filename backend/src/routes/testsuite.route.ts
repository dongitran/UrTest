import { zValidator } from '@hono/zod-validator';
import fp from 'lodash/fp';
import dayjs from 'dayjs';
import db from 'db/db';
import { TestSuiteExecuteTable, TestSuiteTable } from 'db/schema';
import { eq, inArray } from 'drizzle-orm';
import CreateOrUpdateFile from 'lib/Github/CreateOrUpdateFile';
import { Hono } from 'hono';
import { get, set } from 'lodash';
import { ulid } from 'ulid';
import { z } from 'zod';
import { DeleteFileFromGithub } from 'lib/Github/DeleteFile';
import RunTest from 'lib/Runner/RunTest';
import RunProjectTests from 'lib/Runner/RunProjectTests';
import * as TestSuiteSchema from 'lib/Zod/TestSuiteSchema';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';
import CheckProjectAccess from '@middlewars/CheckProjectAccess';
import CheckFileFromGithub from 'lib/Github/CheckFile';
import { logActivity, ACTIVITY_TYPES } from '../lib/ActivityLogger';

const TestSuiteRoute = new Hono();

TestSuiteRoute.get(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', TestSuiteSchema.schemaForIdParamOnly),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');

    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!testSuite) {
      return ctx.json({ message: 'Không tìm thấy thông tin kịch bản test' }, 404);
    }

    const oauthToken = await db.query.OAuthTokensTable.findFirst({
      where: (clm, { eq }) => eq(clm.userEmail, user.email),
    });

    let jiraConnectionInfo = {
      isJiraLinked: false,
      remoteLinkData: null,
    };

    if (oauthToken) {
      jiraConnectionInfo.isJiraLinked = true;

      const remoteLinkData = await db.query.RemoteLinkLocksTable.findFirst({
        where: (clm, { eq, and, isNull }) => and(eq(clm.testSuiteId, id), isNull(clm.deletedAt)),
      });

      if (remoteLinkData) {
        jiraConnectionInfo.remoteLinkData = {
          id: remoteLinkData.id,
          issueKey: remoteLinkData.issueKey,
          applicationType: remoteLinkData.applicationType,
          applicationName: remoteLinkData.applicationName,
          email: remoteLinkData.email,
          createdAt: remoteLinkData.createdAt,
          updatedAt: remoteLinkData.updatedAt,
        };
      }
    }

    return ctx.json({
      ...testSuite,
      jiraConnection: jiraConnectionInfo,
    });
  }
);

TestSuiteRoute.post(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('json', TestSuiteSchema.shemaForCreateAndPatch),
  async (ctx) => {
    const user = ctx.get('user');
    const body = ctx.req.valid('json');
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });
    if (!project) {
      return ctx.json({ message: 'Thông tìm thấy thông tin của Project' }, 404);
    } else if (project.deletedAt) {
      return ctx.json({ message: 'Project đã bị xóa nên không thể tạo kịch bản test' }, 400);
    }
    const status = body.resultRunner ? 'Completed' : 'Not Run';
    const lastRunDate = body.resultRunner ? dayjs().toISOString() : undefined;
    const testSuite = await db
      .insert(TestSuiteTable)
      .values({
        createdAt: dayjs().toISOString(),
        id: ulid(),
        name: body.name,
        projectId: body.projectId,
        content: body.content,
        createdBy: user.email,
        description: body.description,
        status,
        tags: body.tags,
        lastRunDate,
        params: {
          resultRunner: body.resultRunner,
          duration: body.duration,
        },
      })
      .returning()
      .then((res) => res[0]);

    if (project.slug && testSuite.content) {
      CreateOrUpdateFile(
        {
          projectSlug: project.slug,
          fileContent: testSuite.content,
          fileName: `${testSuite.id}-${testSuite.fileName}.robot`,
        },
        async (data: Record<string, any>) => {
          if (Object.hasOwn(data, 'content') && Object.hasOwn(data, 'commit')) {
            await db
              .update(TestSuiteTable)
              .set({ params: { ...(testSuite.params || {}), githubData: data } })
              .where(eq(TestSuiteTable.id, testSuite.id));
          } else {
            await db
              .update(TestSuiteTable)
              .set({ status: 'Aborted', params: { ...(testSuite.params || {}), errorData: data } })
              .where(eq(TestSuiteTable.id, testSuite.id));
          }
        }
      );
    }

    await logActivity(
      ACTIVITY_TYPES.TEST_SUITE_CREATED,
      body.projectId,
      user.email,
      `Created test suite "${body.name}"`,
      testSuite.id,
      'test_suite'
    );

    return ctx.json({ message: 'ok' });
  }
)
  .post(
    '/:id/retry-sync',
    zValidator('param', TestSuiteSchema.schemaForIdParamOnly),
    async (ctx) => {
      const { id } = ctx.req.valid('param');
      const user = ctx.get('user');
      const testSuite = await db.query.TestSuiteTable.findFirst({
        where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
        with: { project: true },
      });
      if (!testSuite) {
        return ctx.json({ message: 'Không tìm thấy kịch bản test' }, 404);
      }
      const fileFromGithub = await CheckFileFromGithub({
        path: `${testSuite.id}-${testSuite.fileName}.robot`,
        projectSlug: testSuite.project.slug,
      });
      const newParams = testSuite.params || {};
      if (fileFromGithub) {
        set(newParams, 'githubData.content', fileFromGithub);
      } else {
        await CreateOrUpdateFile(
          {
            fileContent: testSuite.content,
            fileName: `${testSuite.id}-${testSuite.fileName}.robot`,
            projectSlug: testSuite.project.slug,
          },
          (data) => {
            set(newParams, 'githubData', data);
          }
        );
      }
      await db
        .update(TestSuiteTable)
        .set({
          status: 'Not Run',
          params: newParams,
          updatedAt: dayjs().toISOString(),
          updatedBy: user.email,
        })
        .where(eq(TestSuiteTable.id, testSuite.id));
      return ctx.json({ message: 'ok' });
    }
  )
  .post(
    '/:id/execute',
    CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
    CheckProjectAccess(),
    zValidator('param', TestSuiteSchema.schemaForIdParamOnly),
    zValidator(
      'json',
      z.object({
        status: z.enum(['pending', 'processing', 'success', 'failed']),
        testSuiteStatus: z.enum(['Not Run', 'Running', 'Completed', 'Failed', 'Aborted']),
      })
    ),
    async (ctx) => {
      const { id } = ctx.req.valid('param');
      const user = ctx.get('user');
      const body = ctx.req.valid('json');
      const testSuite = await db.query.TestSuiteTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, id),
        with: { project: true },
      });
      if (!testSuite) {
        return ctx.json({ message: 'Không tìm thấy kịch bản test' }, 404);
      } else if (testSuite.status === 'Running') {
        return ctx.json(
          {
            message: 'Kịch bản test đang được thực thi. Vui lòng đợi kết thúc rồi thực hiện lại',
          },
          400
        );
      } else if (!testSuite.content) {
        return ctx.json(
          {
            message: 'Kịch bản test không có nội dung về test case nên không thể thực hiện',
          },
          400
        );
      } else if (!testSuite.fileName) {
        return ctx.json(
          {
            message: 'Kịch bản test không tồn tại fileName nên không thể thực hiện',
          },
          400
        );
      }

      if (!testSuite.project) {
        return ctx.json({ message: 'Không tìm thấy Project' }, 404);
      } else if (testSuite.project.deletedAt) {
        return ctx.json(
          {
            message: 'Project đã bị xóa nên không thể thực hiện kịch bản test',
          },
          400
        );
      } else if (!testSuite.project.slug) {
        return ctx.json(
          {
            message: 'Hiện Project chưa có tên slug nên không thể thực thi kịch bản test',
          },
          400
        );
      }

      const listTestSuiteExecute = await db.query.TestSuiteExecuteTable.findMany({
        where: (clm, { eq, and }) =>
          and(eq(clm.testSuiteId, testSuite.id), eq(clm.status, 'processing')),
      });
      if (listTestSuiteExecute.length >= 1) {
        return ctx.json(
          {
            message:
              'Kịch bản test đang được thực thi ở tiến trình. Vui lòng đợi kết thúc rồi thực hiện lại',
          },
          400
        );
      }
      let testSuiteExecute: typeof TestSuiteExecuteTable.$inferInsert;
      await db.transaction(async (tx) => {
        testSuiteExecute = await tx
          .insert(TestSuiteExecuteTable)
          .values({
            createdAt: dayjs().toISOString(),
            createdBy: user.email,
            id: ulid(),
            testSuiteId: id,
            status: body.status,
          })
          .returning()
          .then((res) => res[0]);

        await tx
          .update(TestSuiteTable)
          .set({
            status: body.testSuiteStatus,
          })
          .where(eq(TestSuiteTable.id, testSuite.id));
      });
      const startRun = dayjs();
      RunTest({
        projectName: testSuite.project.slug,
        content: testSuite.content,
        testResultTitle: 'TestSuite-' + testSuite.fileName,
      })
        .then(async (res) => {
          const endRun = dayjs();
          let testSuiteExecuteStatus = 'success',
            testSuiteStatus = 'Completed';
          if (get(res, 'error') === true) {
            testSuiteExecuteStatus = 'failed';
            testSuiteStatus = 'Failed';
          }
          await db
            .update(TestSuiteExecuteTable)
            .set({
              params: {
                ...(testSuiteExecute.params || {}),
                resultRunner: res,
              },
              status: testSuiteExecuteStatus as any,
              updatedAt: dayjs().toISOString(),
              updatedBy: 'SYSTEM-RUNER',
            })
            .where(eq(TestSuiteExecuteTable.id, testSuiteExecute.id));
          await db
            .update(TestSuiteTable)
            .set({
              params: {
                ...(testSuite.params || {}),
                resultRunner: res,
                duration: endRun.diff(startRun, 'second'),
              },
              status: testSuiteStatus as any,
              lastRunDate: dayjs().toISOString(),
              updatedAt: dayjs().toISOString(),
              updatedBy: 'SYSTEM-RUNER',
            })
            .where(eq(TestSuiteTable.id, testSuite.id));
        })
        .catch(async () => {
          const endRun = dayjs();
          await db
            .update(TestSuiteExecuteTable)
            .set({
              status: 'failed',
              updatedAt: dayjs().toISOString(),
              updatedBy: 'SYSTEM-RUNER',
            })
            .where(eq(TestSuiteExecuteTable.id, testSuiteExecute.id));
          await db
            .update(TestSuiteTable)
            .set({
              params: {
                ...(testSuite.params || {}),
                duration: endRun.diff(startRun, 'second'),
                resultRunner: null,
              },
              status: 'Failed',
              lastRunDate: dayjs().toISOString(),
              updatedAt: dayjs().toISOString(),
              updatedBy: 'SYSTEM-RUNER',
            })
            .where(eq(TestSuiteTable.id, testSuite.id));
        });
      return ctx.json({ message: 'ok' });
    }
  )
  .post(
    '/draft-execute',
    CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
    CheckProjectAccess(),
    zValidator(
      'json',
      z.object({
        projectId: z.string().ulid(),
        content: z.string(),
      })
    ),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const project = await db.query.ProjectTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, body.projectId),
      });
      if (!project) {
        return ctx.json({ message: 'Không tìm thấy thông tin Project' }, 404);
      }
      const startRun = dayjs();
      const resultRunner = await RunTest({
        content: body.content,
        projectName: project.slug,
      });
      const endRun = dayjs();
      if (!get(resultRunner, 'reportUrl')) {
        return ctx.json(
          {
            message: 'Không có thông tin reportUrl từ phản hồi khi chạy kịch bản test',
          },
          400
        );
      }
      return ctx.json({
        resultRunner,
        duration: endRun.diff(startRun, 'second'),
      });
    }
  )
  .post(
    '/execute/all',
    CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
    CheckProjectAccess(),
    zValidator('json', z.object({ projectId: z.string().ulid() })),
    async (ctx) => {
      const { projectId } = ctx.req.valid('json');
      const user = ctx.get('user');
      const project = await db.query.ProjectTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, projectId),
      });
      if (!project) {
        return ctx.json({ message: 'Thông tìm thấy thông tin của Project' }, 404);
      } else if (project.deletedAt) {
        return ctx.json({ message: 'Project đã bị xóa nên không thể tạo kịch bản test' }, 400);
      }
      const listTestSuite = await db.query.TestSuiteTable.findMany({
        where: (clm, { ne, eq, isNull, and }) =>
          and(eq(clm.projectId, projectId), isNull(clm.deletedAt), ne(clm.status, 'Running')),
      });
      const testSuiteIds = listTestSuite.map((i) => i.id);

      const runningExecutes = await db.query.TestSuiteExecuteTable.findMany({
        where: (clm, { eq, and }) =>
          and(eq(clm.projectId, projectId), eq(clm.status, 'processing')),
      });

      if (runningExecutes.length > 0) {
        return ctx.json(
          {
            message:
              'Đang có 1 tiến trình thực hiện cho project này. Vui lòng đợi kết thúc rồi thực hiện lại',
          },
          400
        );
      }

      const projectExecuteId = ulid();
      const projectExecute = await db
        .insert(TestSuiteExecuteTable)
        .values({
          createdAt: dayjs().toISOString(),
          createdBy: user.email,
          id: projectExecuteId,
          projectId: projectId,
          status: 'processing',
          params: {
            testSuiteIds: testSuiteIds,
            totalTests: testSuiteIds.length,
          },
        })
        .returning()
        .then((res) => res[0]);

      await db
        .update(TestSuiteTable)
        .set({
          status: 'Running',
          params: (table) => ({
            ...table.params,
            projectExecuteId: projectExecuteId,
          }),
        })
        .where(inArray(TestSuiteTable.id, testSuiteIds));

      const startRun = dayjs();
      RunProjectTests({ projectName: project.slug })
        .then(async (result) => {
          console.log(result, 'resultresult');
          const endRun = dayjs();
          const duration = endRun.diff(startRun, 'second');

          await db
            .update(TestSuiteTable)
            .set({
              updatedAt: dayjs().toISOString(),
              updatedBy: user.email,
              lastRunDate: dayjs().toISOString(),
              status: 'Completed',
              params: (table) => ({
                ...table.params,
                resultRunner: result,
                duration: duration,
              }),
            })
            .where(inArray(TestSuiteTable.id, testSuiteIds));

          await db
            .update(TestSuiteExecuteTable)
            .set({
              status: 'success',
              params: {
                ...projectExecute.params,
                resultRunner: result,
                duration: duration,
                completedTestSuites: testSuiteIds.length,
              },
              updatedAt: dayjs().toISOString(),
              updatedBy: user.email,
            })
            .where(eq(TestSuiteExecuteTable.id, projectExecuteId));
        })
        .catch(async (error) => {
          console.error('Error running project tests:', error);
          const endRun = dayjs();
          const duration = endRun.diff(startRun, 'second');

          await db
            .update(TestSuiteTable)
            .set({
              updatedAt: dayjs().toISOString(),
              updatedBy: user.email,
              lastRunDate: dayjs().toISOString(),
              status: 'Failed',
              params: (table) => ({
                ...table.params,
                resultRunner: null,
                duration: duration,
              }),
            })
            .where(inArray(TestSuiteTable.id, testSuiteIds));

          await db
            .update(TestSuiteExecuteTable)
            .set({
              status: 'failed',
              params: {
                ...projectExecute.params,
                error: String(error),
                duration: duration,
              },
              updatedAt: dayjs().toISOString(),
              updatedBy: user.email,
            })
            .where(eq(TestSuiteExecuteTable.id, projectExecuteId));
        });

      return ctx.json({ message: 'ok' });
    }
  );

TestSuiteRoute.patch(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', TestSuiteSchema.schemaForIdParamOnly),
  zValidator('json', TestSuiteSchema.shemaForCreateAndPatch),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');
    const body = ctx.req.valid('json');

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });
    if (!project) {
      return ctx.json({ message: 'Thông tìm thấy thông tin của Project' }, 404);
    } else if (project.deletedAt) {
      return ctx.json({ message: 'Project đã bị xóa nên không thể tạo kịch bản test' }, 400);
    }

    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });
    if (!testSuite) {
      return ctx.json({ message: 'Không tìm thấy thông tin kịch bản test' }, 404);
    } else if (testSuite.status === 'Running') {
      return ctx.json({ message: 'Không thể chỉnh sửa kịch bản test khi đang được thực thi' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testSuite.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message: 'Forbidden: Staff members can only update test suites they created',
        },
        403
      );
    }

    const sha = get(testSuite, 'params.githubData.content.sha');
    if (!sha) {
      return ctx.json(
        {
          message: 'Không tìm thấy SHA để có thể động bộ sang UrTest Workflow Github',
        },
        400
      );
    }
    if (body.resultRunner) {
      set(testSuite, 'params.resultRunner', body.resultRunner);
    }
    const testSuiteUpdated = await db
      .update(TestSuiteTable)
      .set({
        updatedAt: dayjs().toISOString(),
        updatedBy: user.email,
        content: body.content,
        description: body.description,
        name: body.name,
        tags: body.tags,
        params: {
          ...(testSuite.params || {}),
        },
      })
      .where(eq(TestSuiteTable.id, testSuite.id))
      .returning()
      .then((res) => res[0]);

    if (project.slug && testSuite.content && testSuiteUpdated.content) {
      if (testSuite.name !== testSuiteUpdated.name) {
        DeleteFileFromGithub({
          fileName: `${testSuite.id}-${testSuite.fileName}.robot`,
          projectSlug: project.slug,
        });
      }
      CreateOrUpdateFile(
        {
          projectSlug: project.slug,
          fileContent: testSuiteUpdated.content,
          fileName: `${testSuiteUpdated.id}-${testSuiteUpdated.fileName}.robot`,
          sha,
        },
        async (data: Record<string, any>) => {
          await db
            .update(TestSuiteTable)
            .set({
              params: {
                ...(testSuite.params || {}),
                githubData: data,
              },
            })
            .where(eq(TestSuiteTable.id, testSuiteUpdated.id));
        }
      );
    }

    await logActivity(
      ACTIVITY_TYPES.TEST_SUITE_UPDATED,
      body.projectId,
      user.email,
      `Updated test suite "${body.name}"`,
      testSuite.id,
      'test_suite',
      {
        previousName: testSuite.name,
        newName: body.name,
      }
    );

    return ctx.json({ message: 'ok' });
  }
);

TestSuiteRoute.delete(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('param', TestSuiteSchema.schemaForIdParamOnly),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');

    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
      with: {
        project: true,
      },
    });

    if (!testSuite) {
      return ctx.json({ message: 'Không tìm thấy kịch bản test để xóa' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testSuite.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message: 'Forbidden: Staff members can only delete test suites they created',
        },
        403
      );
    }

    if (testSuite.project && testSuite.project.slug) {
      await DeleteFileFromGithub({
        fileName: `${testSuite.id}-${testSuite.fileName}.robot`,
        projectSlug: testSuite.project.slug,
      });
    }

    await db
      .update(TestSuiteTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(TestSuiteTable.id, id));

    await logActivity(
      ACTIVITY_TYPES.TEST_SUITE_DELETED,
      testSuite.projectId,
      user.email,
      `Deleted test suite "${testSuite.name}"`,
      testSuite.id,
      'test_suite'
    );

    return ctx.json({ message: 'ok' });
  }
);

export default TestSuiteRoute;
