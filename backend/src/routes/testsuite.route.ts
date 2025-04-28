import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { TestSuiteTable } from "db/schema";
import { Hono } from "hono";
import { ulid } from "ulid";
import { z } from "zod";

const TestSuiteRoute = new Hono();
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
    await db.insert(TestSuiteTable).values({
      createdAt: dayjs().toISOString(),
      id: ulid(),
      name: body.name,
      projectId: body.projectId,
      content: body.content,
      createdBy: user.email,
      description: body.description,
      status: "Not Run",
    });
    return ctx.json({ message: "ok" });
  }
);
export default TestSuiteRoute;
