import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import db from "db/db";
import { TestResourceTable } from "db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import CreateMultipleFiles from "lib/Github/CreateMultipleFiles";
import CheckFileFromGithub from "lib/Github/CheckFile";
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
    
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, body.projectId),
    });
    
    if (!project) {
      return ctx.json({ message: "Project not found" }, 404);
    }
    
    const testResource = await db.insert(TestResourceTable).values({
      content: body.content,
      createdAt: dayjs().toISOString(),
      createdBy: user.email,
      description: body.description,
      id: ulid(),
      projectId: body.projectId,
      title: body.title,
    }).returning().then(res => res[0]);
    
    if (project.slug && testResource.fileName) {
      try {
        const initRobotPath = `resources/init.robot`;
        const initRobotFile = await CheckFileFromGithub({
          projectSlug: project.slug,
          fileName: initRobotPath
        });
        
        const resourceFilePath = `resources/${testResource.fileName}.robot`;
        
        const files = [
          {
            path: resourceFilePath,
            content: testResource.content
          }
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
            sha: initRobotFile.sha
          });
        } else {
          files.push({
            path: initRobotPath,
            content: `*** Settings ***\nResource    ./${testResource.fileName}.robot\n`
          });
        }
        
        await CreateMultipleFiles({
          projectSlug: project.slug,
          files: files,
          commitMessage: `Add test resource ${testResource.fileName} and update init.robot`
        });
        
        await db
          .update(TestResourceTable)
          .set({
            params: {
              ...(testResource.params || {}),
              githubCreated: true,
              githubCreatedAt: dayjs().toISOString()
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
export default TestResourceRoute;
