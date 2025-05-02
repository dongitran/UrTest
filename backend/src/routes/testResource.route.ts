import { zValidator } from "@hono/zod-validator";
import * as TestResourceSchema from "../lib/Zod/TestResourceSchema";
import dayjs from "dayjs";
import db from "db/db";
import { TestResourceTable } from "db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import CreateMultipleFiles from "lib/Github/CreateMultipleFiles";
import CheckFileFromGithub from "lib/Github/CheckFile";
import { DeleteFileFromGithub } from "lib/Github/DeleteFile";
import { ulid } from "ulid";
import { z } from "zod";
import CreateOrUpdateFile from "lib/Github/CreateOrUpdateFile";
import CheckPermission, { ROLES } from "@middlewars/CheckPermission";

const TestResourceRoute = new Hono();

TestResourceRoute.get(
  "/",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator(
    "query",
    z.object({
      projectId: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const query = ctx.req.valid("query");
    const listTestResource = await db.query.TestResourceTable.findMany({
      where: (clm, { and, eq, isNull }) => {
        return and(eq(clm.projectId, query.projectId), isNull(clm.deletedAt));
      },
      orderBy: (clm, { desc }) => desc(clm.id),
    });
    return ctx.json({ listTestResource });
  }
);

TestResourceRoute.post(
  "/",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator("json", TestResourceSchema.schemaForCreateAndPatch),
  async (ctx) => {
    const body = ctx.req.valid("json");
    const user = ctx.get("user");

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });

    if (!project) {
      return ctx.json({ message: "Project not found" }, 404);
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

    if (project.slug && testResource.fileName) {
      try {
        const initRobotPath = `resources/init.robot`;
        const initRobotFile = await CheckFileFromGithub({
          projectSlug: project.slug,
          path: initRobotPath,
        });

        const resourceFilePath = `resources/${testResource.fileName}.robot`;

        const files: { path: string; content: string; sha?: string }[] = [
          {
            path: resourceFilePath,
            content: testResource.content,
          },
        ];

        if (initRobotFile) {
          let currentContent = Buffer.from(
            initRobotFile.content,
            "base64"
          ).toString("utf-8");

          const newResourceReference = `Resource    ./${testResource.fileName}.robot`;
          if (!currentContent.includes(newResourceReference)) {
            if (currentContent && !currentContent.endsWith("\n")) {
              currentContent += "\n";
            }
            currentContent += newResourceReference + "\n";
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
      } catch (error) {
        console.log(error, "Create resource error");
      }
    }

    return ctx.json({ message: "ok" });
  }
);

TestResourceRoute.patch(
  "/:id",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator("json", TestResourceSchema.schemaForCreateAndPatch),
  async (ctx) => {
    const body = ctx.req.valid("json");
    const user = ctx.get("user");
    const { id } = ctx.req.valid("param");
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq, isNull, and }) =>
        and(eq(clm.id, body.projectId), isNull(clm.deletedAt)),
    });

    if (!project) {
      return ctx.json({ message: "Project not found" }, 404);
    }
    const testResource = await db.query.TestResourceTable.findFirst({
      where: (clm, { eq, and, isNull }) =>
        and(
          isNull(clm.deletedAt),
          eq(clm.id, id),
          eq(clm.projectId, project.id)
        ),
    });
    if (!testResource) {
      return ctx.json(
        { message: "Không tìm thấy thông tin của Test Resource" },
        404
      );
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testResource.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message:
            "Forbidden: Staff members can only update test resources they created",
        },
        403
      );
    }

    const testResourceUpdated = await db
      .update(TestResourceTable)
      .set({
        content: body.content,
        description: body.description,
        updatedAt: dayjs().toISOString(),
        updatedBy: user.email,
      })
      .where(eq(TestResourceTable.id, testResource.id))
      .returning()
      .then((res) => res[0]);

    if (project.slug && testResourceUpdated.fileName) {
      const testResourceFileFromGithub = await CheckFileFromGithub({
        projectSlug: project.slug,
        path: `resources/${testResource.fileName}.robot`,
      });
      await CreateOrUpdateFile({
        fileContent: testResourceUpdated.content,
        fileName: `resources/${testResource.fileName}.robot`,
        projectSlug: project.slug,
        sha: testResourceFileFromGithub.sha,
      });
    }
    return ctx.json({ message: "ok" });
  }
);

TestResourceRoute.delete(
  "/:id",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const user = ctx.get("user");

    const testResource = await db.query.TestResourceTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });

    if (!testResource) {
      return ctx.json({ message: "Test resource not found" }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = testResource.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json(
        {
          message:
            "Forbidden: Staff members can only delete test resources they created",
        },
        403
      );
    }

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, testResource.projectId),
    });

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
          let currentContent = Buffer.from(
            initRobotFile.content,
            "base64"
          ).toString("utf-8");

          const updatedContent = currentContent
            .split("\n")
            .filter((line) => {
              return !(
                line.includes(`${testResource.fileName}.robot`) ||
                line.includes(`./${testResource.fileName}.robot`)
              );
            })
            .join("\n");

          if (updatedContent !== currentContent) {
            await CreateOrUpdateFile({
              projectSlug: project.slug,
              fileContent: updatedContent,
              fileName: initRobotPath,
              sha: initRobotFile.sha,
            });
          }
        }
      } catch (error) {
        console.log(error, "Delete resource error");
      }
    }

    await db
      .update(TestResourceTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(TestResourceTable.id, id));

    return ctx.json({ message: "ok" });
  }
);

export default TestResourceRoute;
