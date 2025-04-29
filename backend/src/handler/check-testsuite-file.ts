export default async function CheckTestSuiteFile({
  projectSlug,
  testSuiteName,
}: {
  projectSlug: string;
  testSuiteName: string;
}) {
  const checkRes = await fetch(`${Bun.env.GITHUB_URTEST_WORKFLOW_API}/contents/tests/${projectSlug}/${testSuiteName}`, {
    headers: {
      Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (checkRes.ok) return await checkRes.json();

  return null;
}
