import db from "db/db";
import { z } from "zod";

const checkStatusTestSuite = async (ws: Bun.ServerWebSocket<unknown>, message: any) => {
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
    let count = 0;
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
    }
    ws.send(JSON.stringify({ key: "reRenderTestSuiteList", testSuiteName: testSuite.name }));
  }
};
export default checkStatusTestSuite;
