import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { ProjectTable } from "db/schema";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";
import { eq, isNull, and } from "drizzle-orm";

const ProjectRoute = new Hono();

ProjectRoute.get("/", async (ctx) => {
  try {
    const projects = await db
      .select()
      .from(ProjectTable)
      .where(isNull(ProjectTable.deletedAt))
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
});

ProjectRoute.get("/:id", async (ctx) => {
  try {
    const id = ctx.req.param("id");

    const project = await db
      .select()
      .from(ProjectTable)
      .where(and(eq(ProjectTable.id, id), isNull(ProjectTable.deletedAt)))
      .execute();

    if (!project || project.length === 0) {
      return ctx.json({ message: "Project not found" }, 404);
    }

    return ctx.json({ project: project[0] });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return ctx.json(
      { message: "Failed to fetch project", error: errorMessage },
      500
    );
  }
});

ProjectRoute.post(
  "/",
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

    await db.insert(ProjectTable).values({
      createdAt: dayjs().toISOString(),
      description: body.description,
      id: ulid(),
      title: body.title,
      createdBy: user.email,
    });
    return ctx.json({ message: "ok" });
  }
);

export default ProjectRoute;
