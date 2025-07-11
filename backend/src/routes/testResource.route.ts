import { zValidator } from '@hono/zod-validator';
import * as TestResourceSchema from '../lib/Zod/TestResourceSchema';
import dayjs from 'dayjs';
import db from 'db/db';
import { TestResourceTable, ProjectTable } from 'db/schema';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import CreateMultipleFiles from 'lib/Github/CreateMultipleFiles';
import CheckFileFromGithub from 'lib/Github/CheckFile';
import { DeleteFileFromGithub } from 'lib/Github/DeleteFile';
import { ulid } from 'ulid';
import { z } from 'zod';
import CreateOrUpdateFile from 'lib/Github/CreateOrUpdateFile';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';
import CheckProjectAccess from '@middlewars/CheckProjectAccess';
import RefreshRepo from 'lib/Runner/RefreshRepo';
import { logActivity, ACTIVITY_TYPES } from '../lib/ActivityLogger';

const TestResourceRoute = new Hono();

type Project = typeof ProjectTable.$inferSelect;
type TestResource = typeof TestResourceTable.$inferSelect;

async function handleGitHubCreateInBackground(
  project: Project,
  testResource: TestResource
): Promise<void> {
  if (project.slug && testResource.fileName) {
    try {
      const initRobotPath = `resources/init.robot`;
      const initRobotFile = await CheckFileFromGithub({
        projectSlug: project.slug,
        path: initRobotPath,
      });

      const resourceFilePath = `resources/${testResource.fileName}.robot`;

      const files = [
        {
          path: resourceFilePath,
          content: testResource.content,
        },
      ];

      if (initRobotFile) {
        let currentContent = Buffer.from(initRobotFile.content, 'base64').toString('utf-8');

        const newResourceReference = `Resource    ./${testResource.fileName}.robot`;
        if (!currentContent.includes(newResourceReference)) {
          if (currentContent && !currentContent.endsWith('\n')) {
            currentContent += '\n';
          }
          currentContent += newResourceReference + '\n';
        }

        files.push({
          path: initRobotPath,
          content: currentContent,
          sha: initRobotFile.sha,
        });
      } else {
        files.push({
          path: initRobotPath,
          content: `*** Settings ***\nResource    ./${testResource.fileName}.robot\n`,
        });
      }

      await CreateMultipleFiles({
        projectSlug: project.slug,
        files: files,
        commitMessage: `Add test resource ${testResource.fileName} and update init.robot`,
      });

      await db
        .update(TestResourceTable)
        .set({
          params: {
            ...(testResource.params || {}),
            githubCreated: true,
            githubCreatedAt: dayjs().toISOString(),
          },
        })
        .where(eq(TestResourceTable.id, testResource.id));

      await RefreshRepo();

      await logActivity(
        ACTIVITY_TYPES.TEST_SUITE_CREATED,
        project.id,
        testResource.createdBy || '',
        `Created test suite "${testResource.title}"`,
        testResource.id,
        'test_suite'
      );
    } catch (error: any) {
      console.log(error, 'Create resource error');
      await db
        .update(TestResourceTable)
        .set({
          params: {
            ...(testResource.params || {}),
            githubError: true,
            githubErrorMessage: error?.message || 'Unknown error during GitHub operations',
          },
        })
        .where(eq(TestResourceTable.id, testResource.id));
    }
  }
}

async function handleGitHubUpdateInBackground(
  project: Project,
  testResource: TestResource,
  testResourceUpdated: TestResource
): Promise<void> {
  if (project.slug && testResourceUpdated.fileName) {
    try {
      const testResourceFileFromGithub = await CheckFileFromGithub({
        projectSlug: project.slug,
        path: `resources/${testResource.fileName}.robot`,
      });

      if (testResourceFileFromGithub) {
        await CreateOrUpdateFile({
          fileContent: testResourceUpdated.content,
          fileName: `resources/${testResource.fileName}.robot`,
          projectSlug: project.slug,
          sha: testResourceFileFromGithub.sha,
        });

        await RefreshRepo();

        await db
          .update(TestResourceTable)
          .set({
            params: {
              ...(testResourceUpdated.params || {}),
              githubUpdated: true,
              githubUpdatedAt: dayjs().toISOString(),
            },
          })
          .where(eq(TestResourceTable.id, testResourceUpdated.id));

        await logActivity(
          ACTIVITY_TYPES.TEST_RESOURCE_UPDATED,
          project.id,
          testResourceUpdated.updatedBy || testResourceUpdated.createdBy || '',
          `Updated test resource "${testResourceUpdated.title}"`,
          testResource.id,
          'test_resource',
          {
            previousTitle: testResource.title,
            newTitle: testResourceUpdated.title,
          }
        );
      } else {
        console.log('GitHub file not found for update, might need to create it instead');
      }
    } catch (error: any) {
      console.log(error, 'Update resource error');
      await db
        .update(TestResourceTable)
        .set({
          params: {
            ...(testResourceUpdated.params || {}),
            githubError: true,
            githubErrorMessage: error?.message || 'Unknown error during GitHub update',
          },
        })
        .where(eq(TestResourceTable.id, testResourceUpdated.id));
    }
  }
}

async function handleGitHubDeleteInBackground(
  project: Project | null | undefined,
  testResource: TestResource,
  deletedBy: string
): Promise<void> {
  if (project?.slug && testResource.fileName) {
    try {
      await DeleteFileFromGithub({
        projectSlug: project.slug,
        fileName: `resources/${testResource.fileName}.robot`,
      });

      const initRobotPath = `resources/init.robot`;
      const initRobotFile = await CheckFileFromGithub({
        projectSlug: project.slug,
        path: initRobotPath,
      });

      if (initRobotFile) {
        let currentContent = Buffer.from(initRobotFile.content, 'base64').toString('utf-8');

        const updatedContent = currentContent
          .split('\n')
          .filter((line) => {
            return !(
              line.includes(`${testResource.fileName}.robot`) ||
              line.includes(`./${testResource.fileName}.robot`)
            );
          })
          .join('\n');

        if (updatedContent !== currentContent) {
          await CreateOrUpdateFile({
            projectSlug: project.slug,
            fileContent: updatedContent,
            fileName: initRobotPath,
            sha: initRobotFile.sha,
          });
        }
      }

      await RefreshRepo();

      await logActivity(
        ACTIVITY_TYPES.TEST_RESOURCE_DELETED,
        testResource.projectId,
        deletedBy,
        `Deleted test resource "${testResource.title}"`,
        testResource.id,
        'test_resource'
      );
    } catch (error: any) {
      console.log(error, 'Delete resource error');
    }
  }
}

TestResourceRoute.get(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator(
    'query',
    z.object({
      projectId: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const query = ctx.req.valid('query');
    const listTestResource = await db.query.TestResourceTable.findMany({
      where: (clm, { and, eq, isNull }) => {
        return and(eq(clm.projectId, query.projectId), isNull(clm.deletedAt));
      },
      orderBy: (clm, { desc }) => desc(clm.id),
    });
    return ctx.json({ listTestResource });
  }
);

TestResourceRoute.get(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid('param');

    const testResource = await db.query.TestResourceTable.findFirst({
      where: (clm, { and, eq, isNull }) => {
        return and(eq(clm.id, id), isNull(clm.deletedAt));
      },
    });

    if (!testResource) {
      return ctx.json({ message: 'Test resource not found' }, 404);
    }

    return ctx.json({ testResource });
  }
);

TestResourceRoute.post(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('json', TestResourceSchema.schemaForCreateAndPatch),
  async (ctx) => {
    const body = ctx.req.valid('json');
    const user = ctx.get('user');

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }

    const testResource = await db
      .insert(TestResourceTable)
      .values({
        content: body.content,
        createdAt: dayjs().toISOString(),
        createdBy: user.email,
        description: body.description,
        id: ulid(),
        projectId: body.projectId,
        title: body.title,
      })
      .returning()
      .then((res) => res[0]);

    handleGitHubCreateInBackground(project, testResource);

    return ctx.json({
      message: 'ok',
      testResource,
    });
  }
);

TestResourceRoute.patch(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator('json', TestResourceSchema.schemaForCreateAndPatch),
  async (ctx) => {
    const body = ctx.req.valid('json');
    const user = ctx.get('user');
    const { id } = ctx.req.valid('param');
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq, isNull, and }) => and(eq(clm.id, body.projectId), isNull(clm.deletedAt)),
    });

    if (!project) {
      return ctx.json({ message: 'Project not found' }, 404);
    }
    const testResource = await db.query.TestResourceTable.findFirst({
      where: (clm, { eq, and, isNull }) =>
        and(isNull(clm.deletedAt), eq(clm.id, id), eq(clm.projectId, project.id)),
    });
    if (!testResource) {
      return ctx.json({ message: 'Không tìm thấy thông tin của Test Resource' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testResource.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message: 'Forbidden: Staff members can only update test resources they created',
        },
        403
      );
    }

    const testResourceUpdated = await db
      .update(TestResourceTable)
      .set({
        title: body.title,
        content: body.content,
        description: body.description,
        updatedAt: dayjs().toISOString(),
        updatedBy: user.email,
      })
      .where(eq(TestResourceTable.id, testResource.id))
      .returning()
      .then((res) => res[0]);

    handleGitHubUpdateInBackground(project, testResource, testResourceUpdated);

    return ctx.json({
      message: 'ok',
      testResource: testResourceUpdated,
    });
  }
);

TestResourceRoute.delete(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator(
    'param',
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');

    const testResource = await db.query.TestResourceTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });

    if (!testResource) {
      return ctx.json({ message: 'Test resource not found' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testResource.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message: 'Forbidden: Staff members can only delete test resources they created',
        },
        403
      );
    }

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, testResource.projectId),
    });

    await db
      .update(TestResourceTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(TestResourceTable.id, id));

    handleGitHubDeleteInBackground(project, testResource, user.email);

    return ctx.json({ message: 'ok' });
  }
);

export default TestResourceRoute;
