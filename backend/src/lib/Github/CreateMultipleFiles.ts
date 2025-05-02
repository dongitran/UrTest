/**
 * Hàm dùng để tạo hoặc cập nhật nhiều file trong một commit
 */
export default async function CreateMultipleFiles({
  projectSlug,
  files,
  commitMessage,
}: {
  projectSlug: string;
  files: {
    path: string;
    content: string;
    sha?: string;
  }[];
  commitMessage: string;
}): Promise<void> {
  const treeItems = [];

  for (const file of files) {
    treeItems.push({
      path: `tests/${projectSlug}/${file.path}`,
      mode: "100644",
      type: "blob",
      content: file.content,
    });
  }

  const refResponse = await fetch(
    `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/refs/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  const commitResponse = await fetch(
    `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/commits/${latestCommitSha}`,
    {
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  const createTreeResponse = await fetch(
    `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    }
  );

  const treeData = await createTreeResponse.json();
  const newTreeSha = treeData.sha;

  const createCommitResponse = await fetch(
    `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    }
  );

  const newCommitData = await createCommitResponse.json();
  const newCommitSha = newCommitData.sha;

  await fetch(`${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/refs/heads/main`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sha: newCommitSha,
      force: false,
    }),
  });
}
