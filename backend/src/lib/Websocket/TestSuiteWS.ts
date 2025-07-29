import db from "db/db";
import { z } from "zod";

export const checkStatusTestSuite = async (ws: Bun.ServerWebSocket<unknown>, message: any) => {
  const schema = z.object({
    key: z.enum(["checkStatusTestSuite"]),
    testSuiteId: z.string().ulid(),
  });
  const { success, data } = schema.safeParse(message);
  if (success === true) {
    const { testSuiteId } = data;
    const testSuite = await db.query.TestSuiteTable.findFirst({
      where: (clm, { eq }) => eq(clm.id, testSuiteId),
    });
    if (!testSuite) return;
    const testSuiteExecute = await db.query.TestSuiteExecuteTable.findFirst({
      where: (clm, { eq, and }) => and(eq(clm.testSuiteId, testSuite.id), eq(clm.status, "processing")),
    });
    if (!testSuiteExecute) return;
    let count = 0,
      MAX_LOOP = 1000;
    while (true) {
      count++;
      const item = await db.query.TestSuiteExecuteTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, testSuiteExecute.id),
      });
      const _testSuite = await db.query.TestSuiteTable.findFirst({
        where: (clm, { eq }) => eq(clm.id, testSuite.id),
      });
      const validTestSuiteExecuteStatus = item && item.status !== "processing";
      const validTestSuiteStatus = _testSuite && _testSuite.status !== "Running";
      if (validTestSuiteExecuteStatus && validTestSuiteStatus) break;
      if (count >= MAX_LOOP) break;
      await Bun.sleep(500);
    }
    ws.send(JSON.stringify({ key: "reRenderTestSuiteList", testSuiteName: testSuite.name }));
  }
};
export const checkStatusTestSuiteAll = async (ws: Bun.ServerWebSocket<unknown>, message: any) => {
  const schema = z.object({
    key: z.enum(["checkStatusTestSuiteAll"]),
    projectId: z.string().ulid(),
  });
  const { success, data } = schema.safeParse(message);
  if (success === true) {
    const { projectId } = data;
    const project = await db.query.ProjectTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, projectId), isNull(clm.deletedAt)),
    });
    if (!project) return;
    let count = 0,
      MAX_LOOP = 1000;
    while (true) {
      count++;
      const listTestSuite = await db.query.TestSuiteTable.findMany({
        where: (clm, { eq, isNull, and }) =>
          and(eq(clm.projectId, project.id), isNull(clm.deletedAt), eq(clm.status, "Running")),
      });
      if (listTestSuite.length <= 0) {
        break;
      }
      if (count === MAX_LOOP) break;
      await Bun.sleep(500);
    }

    ws.send(JSON.stringify({ key: "reRenderTestSuiteListAll" }));
  }
};
