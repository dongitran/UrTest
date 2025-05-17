import { ulid } from 'ulid';

export default async function RunProjectTests({ projectName }: { projectName: string }) {
  const response = await fetch(`${Bun.env.RUNNER_API_URL}/run-project-tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Bun.env.RUNNER_X_API_KEY!,
    },
    body: JSON.stringify({
      requestId: ulid(),
      project: projectName,
    }),
  });
  const data = await response.json();
  return data;
}
