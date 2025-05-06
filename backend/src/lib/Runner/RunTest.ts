import { ulid } from 'ulid';

export default async function RunTest({
  projectName,
  content,
  testResultTitle,
}: {
  projectName: string;
  content: string;
  testResultTitle?: string;
}) {
  const response = await fetch(`${Bun.env.RUNNER_API_URL}/run-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Bun.env.RUNNER_X_API_KEY!,
    },
    body: JSON.stringify({
      requestId: ulid(),
      project: projectName,
      content: Buffer.from(content).toString('base64'),
      testResultTitle: testResultTitle || 'NONE',
    }),
  });
  const data = await response.json();
  return data;
}
