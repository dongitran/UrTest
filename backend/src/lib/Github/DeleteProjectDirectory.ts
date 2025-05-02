export async function DeleteProjectDirectory(
  projectSlug: string
): Promise<void> {
  try {
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

    const treeResponse = await fetch(
      `${Bun.env.GITHUB_URTEST_WORKFLOW_API}/git/trees/${baseTreeSha}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const treeData = await treeResponse.json();

    const newTreeItems = treeData.tree
      .filter((item) => {
        const isInProjectDir = item.path.startsWith(`tests/${projectSlug}/`);
        const isProjectResource =
          item.path.startsWith(`resources/`) &&
          (item.path.includes(`${projectSlug}-`) ||
            item.path.endsWith(`${projectSlug}.robot`));

        return !isInProjectDir && !isProjectResource;
      })
      .map((item) => ({
        path: item.path,
        mode: item.mode,
        type: item.type,
        sha: item.sha,
      }));

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
          base_tree: null,
          tree: newTreeItems,
        }),
      }
    );

    const newTreeData = await createTreeResponse.json();
    const newTreeSha = newTreeData.sha;

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
          message: `Delete project ${projectSlug} files and resources`,
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

    console.log(
      `Successfully deleted project ${projectSlug} from GitHub in a single commit`
    );
  } catch (error) {
    console.error(`Error deleting project ${projectSlug} from GitHub:`, error);
    throw error;
  }
}
