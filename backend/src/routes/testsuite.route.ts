import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { TestSuiteTable } from "db/schema";
import { eq } from "drizzle-orm";
import CreateOrUpdateTestSuiteFile from "handler/create-new-testsuite-file";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";

const TestSuiteRoute = new Hono();
TestSuiteRoute.get(
  "/:id",
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });
    if (!testSuite) {
      return ctx.json({ message: "Không tìm thấy thông tin kịch bản test" }, 404);
    }
    return ctx.json({ ...testSuite });
  }
);
TestSuiteRoute.post(
  "/",
  zValidator(
    "json",
    z.object({
      projectId: z.string().ulid(),
      name: z.string(),
      description: z.string(),
      content: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ),
  async (ctx) => {
    const user = ctx.get("user");
    const body = ctx.req.valid("json");
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });
    if (!project) {
      return ctx.json({ message: "Thông tìm thấy thông tin của Project" }, 404);
    } else if (project.deletedAt) {
      return ctx.json({ message: "Project đã bị xóa nên không thể tạo kịch bản test" }, 400);
    }
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
        status: "Not Run",
        tags: body.tags,
      })
      .returning()
      .then((res) => res[0]);

    //* Gọi tới Github API để tạo file bên UrTest Workflow
    if (project.slug && testSuite.content) {
      CreateOrUpdateTestSuiteFile(
        {
          projectSlug: project.slug,
          testSuiteContent: testSuite.content,
          testSuiteName: `${testSuite.id}-${testSuite.fileName}.robot`,
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
            .where(eq(TestSuiteTable.id, testSuite.id));
        }
      );
    }
    return ctx.json({ message: "ok" });
  }
);
TestSuiteRoute.patch(
  "/:id",
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator(
    "json",
    z.object({
      projectId: z.string().ulid(),
      name: z.string(),
      description: z.string(),
      content: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const user = ctx.get("user");
    const body = ctx.req.valid("json");
    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });
    if (!testSuite) {
      return ctx.json({ message: "Không tìm thấy thông tin kịch bản test" }, 404);
    }
    await db
      .update(TestSuiteTable)
      .set({
        updatedAt: dayjs().toISOString(),
        updatedBy: user.email,
        content: body.content,
        description: body.description,
        name: body.name,
        tags: body.tags,
      })
      .where(eq(TestSuiteTable.id, testSuite.id));
    return ctx.json({ message: "ok" });
  }
);
TestSuiteRoute.delete(
  "/:id",
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");

    const user = ctx.get("user");
    await db
      .update(TestSuiteTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(TestSuiteTable.id, id));

    return ctx.json({ message: "ok" });
  }
);
export default TestSuiteRoute;
