import CheckFileFromGithub from './CheckFile';

/**
 * Hàm dùng để xóa file trên Github
 * @param param0
 */
export async function DeleteFileFromGithub({
  fileName,
  projectSlug,
}: {
  projectSlug: string;
  fileName: string;
}): Promise<void> {
  const fileData = await CheckFileFromGithub({ projectSlug, path: fileName });
  if (fileData) {
    await fetch(`${Bun.env.GH_URTEST_WORKFLOW_API}/contents/tests/${projectSlug}/${fileName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'Delete old file',
        branch: 'main',
        sha: fileData.sha,
      }),
    });
  }
}
