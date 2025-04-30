import { ulid } from "ulid";

export default async function RunTest({
  projectName,
  content,
  fileName,
}: {
  fileName: string;
  projectName: string;
  content: string;
}) {
  const response = await fetch(`${Bun.env.RUNNER_API_URL}/run-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Bun.env.RUNNER_X_API_KEY!,
    },
    body: JSON.stringify({
      requestId: ulid(),
      project: projectName,
      content: Buffer.from(content).toString("base64"),
      fileName,
    }),
  });
  const data = await response.json();
  console.log("data :>> ", JSON.stringify(data));
  return data;
}
