/**
 * Hàm dùng để kiểm tra file có tồn tại không
 * @param param0
 * @returns
 */
export default async function CheckFileFromGithub({ projectSlug, path }: { projectSlug: string; path: string }) {
  const checkRes = await fetch(`${Bun.env.GITHUB_URTEST_WORKFLOW_API}/contents/tests/${projectSlug}/${path}`, {
    headers: {
      Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (checkRes.ok) return await checkRes.json();

  return null;
}
