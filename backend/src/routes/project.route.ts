import { zValidator } from "@hono/zod-validator";
import fp from "lodash/fp";
import dayjs from "dayjs";
import db from "db/db";
import { ProjectTable } from "db/schema";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";
import { eq, isNull, and, desc } from "drizzle-orm";
import CreateOrUpdateFile from "lib/Github/CreateOrUpdateFile";
import { DeleteProjectDirectory } from "../lib/Github/DeleteProjectDirectory";
import CheckPermission, { ROLES } from "@middlewars/CheckPermission";

const ProjectRoute = new Hono();

ProjectRoute.get(
  "/",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    try {
      const projects = await db
        .select()
        .from(ProjectTable)
        .where(isNull(ProjectTable.deletedAt))
        .orderBy(desc(ProjectTable.id))
        .execute();
      return ctx.json({ projects });
    } catch (error) {
      console.error("Error fetching projects:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return ctx.json(
        { message: "Failed to fetch projects", error: errorMessage },
        500
      );
    }
  }
);

ProjectRoute.get(
  "/:id",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    try {
      const id = ctx.req.param("id");

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
        return ctx.json({ message: "Project not found" }, 404);
      }
      const listTestSuiteId = project.listTestSuite.map((i) => i.id);
      const listTestSuiteExecute =
        await db.query.TestSuiteExecuteTable.findMany({
          where: (clm, { inArray }) =>
            inArray(clm.testSuiteId, listTestSuiteId),
          orderBy: (clm, { desc }) => desc(clm.id),
          limit: 5,
        });

      return ctx.json({
        project: {
          ...project,
          recentTestRun: listTestSuiteExecute.map((item) => {
            const testSuite = project.listTestSuite.find(
              fp.isMatch({ id: item.testSuiteId })
            );
            return {
              id: item.id,
              testSuiteName: testSuite?.name,
              status: item.status,
              createdAt: item.createdAt,
              createdBy: item.createdBy,
            };
          }),
        },
      });
    } catch (error) {
      console.error("Error fetching project by ID:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return ctx.json(
        { message: "Failed to fetch project", error: errorMessage },
        500
      );
    }
  }
);

ProjectRoute.post(
  "/",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    "json",
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  async (ctx) => {
    const body = ctx.req.valid("json");
    const user = ctx.get("user");

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
      const fileContent = "*** Settings ***";
      const fileName = "resources/init.robot";

      try {
        CreateOrUpdateFile({
          projectSlug: project.slug,
          fileContent: fileContent,
          fileName: fileName,
        });
      } catch (error) {
        console.log(error, "Create project error");
      }
    }

    return ctx.json({ message: "ok" });
  }
);

ProjectRoute.patch(
  "/:id",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  zValidator(
    "json",
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const body = ctx.req.valid("json");
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });
    if (!project) {
      return ctx.json(
        {
          message: "Không tìm thấy thông tin Project theo mã ID",
          code: "NOT_FOUND",
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
    return ctx.json({ message: "ok" });
  }
);

ProjectRoute.delete(
  "/:id",
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER]),
  zValidator(
    "param",
    z.object({
      id: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const user = ctx.get("user");
    const { id } = ctx.req.valid("param");

    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, id),
    });

    if (!project) {
      return ctx.json({ message: "Project not found" }, 404);
    }

    if (project.slug) {
      try {
        await DeleteProjectDirectory(project.slug);
      } catch (error) {
        console.error("Error deleting project GitHub resources:", error);
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

    return ctx.json({ message: "ok" });
  }
);

export default ProjectRoute;
