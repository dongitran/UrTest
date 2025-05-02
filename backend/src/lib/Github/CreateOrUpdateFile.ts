/**
 * Hàm dùng để tạo testsuite file cho UrTet Workflow (repository)
 * @param testSuiteName : testSuiteId + fileName. Ví dụ: 01JSVGHZ1XJNAVCBPZPB4QW57T-test1.robot
 */
export default async function CreateOrUpdateFile(
  {
    projectSlug,
    fileContent,
    fileName,
    sha,
  }: {
    projectSlug: string;
    fileName: string;
    fileContent: string;
    sha?: string;
  },
  callback?: (data: Record<string, any>) => void
): Promise<void> {
  const response = await fetch(
    `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/contents/tests/${projectSlug}/${fileName}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `${sha ? 'Update' : 'Create'} ${fileName} testsuite file`,
        content: Buffer.from(fileContent).toString('base64'),
        branch: 'main',
        sha, //? Nếu không có SHA thì là tạo mới, có thì là update
      }),
    }
  );

  const data = await response.json();
  if (callback) callback(data);
}
