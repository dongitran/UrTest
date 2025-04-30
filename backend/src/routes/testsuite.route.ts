import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { TestSuiteExecuteTable, TestSuiteTable } from "db/schema";
import { eq } from "drizzle-orm";
import CreateOrUpdateFile from "lib/Github/CreateOrUpdateFile";
import { Hono } from "hono";
import { get } from "lodash";
import { ulid } from "ulid";
import { z } from "zod";
import { DeleteFileFromGithub } from "lib/Github/DeleteFile";
import RunTest from "lib/Runner/RunTest";

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
      CreateOrUpdateFile(
        {
          projectSlug: project.slug,
          fileContent: testSuite.content,
          fileName: `${testSuite.id}-${testSuite.fileName}.robot`,
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
).post(
  "/:id/execute",
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator(
    "json",
    z.object({
      status: z.enum(["pending", "processing", "success", "failed"]),
      testSuiteStatus: z.enum(["Not Run", "Running", "Completed", "Failed", "Aborted"]),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const user = ctx.get("user");
    const body = ctx.req.valid("json");
    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
      with: { project: true },
    });
    if (!testSuite) {
      return ctx.json({ message: "Không tìm thấy kịch bản test" }, 404);
    } else if (testSuite.status === "Running") {
      return ctx.json({ message: "Kịch bản test đang được thực thi. Vui lòng đợi kết thúc rồi thực hiện lại" }, 400);
    } else if (!testSuite.content) {
      return ctx.json({ message: "Kịch bản test không có nội dung về test case nên không thể thực hiện" }, 400);
    } else if (!testSuite.fileName) {
      return ctx.json({ message: "Kịch bản test không tồn tại fileName nên không thể thực hiện" }, 400);
    }

    if (!testSuite.project) {
      return ctx.json({ message: "Không tìm thấy Project" }, 404);
    } else if (testSuite.project.deletedAt) {
      return ctx.json({ message: "Project đã bị xóa nên không thể thực hiện kịch bản test" }, 400);
    } else if (!testSuite.project.slug) {
      return ctx.json({ message: "Hiện Project chưa có tên slug nên không thể thực thi kịch bản test" }, 400);
    }

    const listTestSuiteExecute = await db.query.TestSuiteExecuteTable.findMany({
      where: (clm, { eq, and }) => and(eq(clm.testSuiteId, testSuite.id), eq(clm.status, "processing")),
    });
    if (listTestSuiteExecute.length >= 1) {
      return ctx.json(
        { message: "Kịch bản test đang được thực thi ở tiến trình. Vui lòng đợi kết thúc rồi thực hiện lại" },
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
    })
      .then(async (res) => {
        const endRun = dayjs();
        await db
          .update(TestSuiteExecuteTable)
          .set({
            status: "success",
            updatedAt: dayjs().toISOString(),
            updatedBy: "SYSTEM-RUNER",
          })
          .where(eq(TestSuiteExecuteTable.id, testSuiteExecute.id));
        await db
          .update(TestSuiteTable)
          .set({
            params: {
              ...(testSuite.params || {}),
              resultRuner: res,
              duration: endRun.diff(startRun, "second"),
            },
            status: "Completed",
            lastRunDate: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
            updatedBy: "SYSTEM-RUNER",
          })
          .where(eq(TestSuiteTable.id, testSuite.id));
      })
      .catch(async () => {
        const endRun = dayjs();
        await db
          .update(TestSuiteExecuteTable)
          .set({
            status: "failed",
            updatedAt: dayjs().toISOString(),
            updatedBy: "SYSTEM-RUNER",
          })
          .where(eq(TestSuiteExecuteTable.id, testSuiteExecute.id));
        await db
          .update(TestSuiteTable)
          .set({
            params: {
              ...(testSuite.params || {}),
              duration: endRun.diff(startRun, "second"),
            },
            status: "Failed",
            lastRunDate: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
            updatedBy: "SYSTEM-RUNER",
          })
          .where(eq(TestSuiteTable.id, testSuite.id));
      });
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

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });
    if (!project) {
      return ctx.json({ message: "Thông tìm thấy thông tin của Project" }, 404);
    } else if (project.deletedAt) {
      return ctx.json({ message: "Project đã bị xóa nên không thể tạo kịch bản test" }, 400);
    }

    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });
    if (!testSuite) {
      return ctx.json({ message: "Không tìm thấy thông tin kịch bản test" }, 404);
    } else if (testSuite.status === "Running") {
      return ctx.json({ message: "Không thể chỉnh sửa kịch bản test khi đang được thực thi" }, 404);
    }
    const sha = get(testSuite, "params.githubData.content.sha");
    if (!sha) {
      return ctx.json({ message: "Không tìm thấy SHA để có thể động bộ sang UrTest Workflow Github" }, 400);
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
    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
      with: {
        project: true,
      },
    });
    if (!testSuite) {
      return ctx.json({ message: "Không tìm thấy kịch bản test để xóa" }, 404);
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

    return ctx.json({ message: "ok" });
  }
);
export default TestSuiteRoute;
