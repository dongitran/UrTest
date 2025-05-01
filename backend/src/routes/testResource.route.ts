import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { TestResourceTable } from "db/schema";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";

const TestResourceRoute = new Hono();
TestResourceRoute.get(
  "/",
  zValidator(
    "query",
    z.object({
      projectId: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const query = ctx.req.valid("query");
    const listTestResource = await db.query.TestResourceTable.findMany({
      where: (clm, { and, eq }) => {
        return and(eq(clm.projectId, query.projectId));
      },
      orderBy: (clm, { desc }) => desc(clm.id),
    });
    return ctx.json({ listTestResource });
  }
);
TestResourceRoute.post(
  "/",
  zValidator(
    "json",
    z.object({
      testResourceId: z.string().ulid().optional(),
      title: z.string(),
      description: z.string(),
      content: z.string(),
      projectId: z.string().ulid(),
    })
  ),
  async (ctx) => {
    const body = ctx.req.valid("json");
    const user = ctx.get("user");
    await db.insert(TestResourceTable).values({
      content: body.content,
      createdAt: dayjs().toISOString(),
      createdBy: user.email,
      description: body.description,
      id: ulid(),
      projectId: body.projectId,
      title: body.title,
    });
    return ctx.json({ message: "ok" });
  }
);
export default TestResourceRoute;
