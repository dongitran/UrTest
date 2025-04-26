import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { ProjectTable } from "db/schema";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";

const ProjectRoute = new Hono();
ProjectRoute.get("/", async (ctx) => {
  return ctx.json({ projects: [] });
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
