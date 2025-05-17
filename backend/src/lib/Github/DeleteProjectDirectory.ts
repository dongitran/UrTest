export async function DeleteProjectDirectory(projectSlug: string): Promise<void> {
  try {
    const response = await fetch(
      `${Bun.env.GH_URTEST_WORKFLOW_API}/contents/tests/${projectSlug}`,
      {
        headers: {
          Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      console.log(`Directory tests/${projectSlug} not found or already deleted`);
      return;
    }

    const contents = await response.json();

    for (const item of contents) {
      if (item.type === 'file') {
        await fetch(`${Bun.env.GH_URTEST_WORKFLOW_API}/contents/${item.path}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Delete file ${item.path} as part of project ${projectSlug} cleanup`,
            sha: item.sha,
            branch: 'main',
          }),
        });
      } else if (item.type === 'dir') {
        const subDirContents = await fetch(
          `${Bun.env.GH_URTEST_WORKFLOW_API}/contents/${item.path}`,
          {
            headers: {
              Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        ).then((res) => res.json());

        for (const subItem of subDirContents) {
          await fetch(`${Bun.env.GH_URTEST_WORKFLOW_API}/contents/${subItem.path}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Delete file ${subItem.path} as part of project ${projectSlug} cleanup`,
              sha: subItem.sha,
              branch: 'main',
            }),
          });
        }
      }
    }

    const resourcesResponse = await fetch(`${Bun.env.GH_URTEST_WORKFLOW_API}/contents/resources`, {
      headers: {
        Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (resourcesResponse.ok) {
      const resourcesContents = await resourcesResponse.json();

      for (const item of resourcesContents) {
        if (item.name.startsWith(`${projectSlug}-`) || item.name === `${projectSlug}.robot`) {
          await fetch(`${Bun.env.GH_URTEST_WORKFLOW_API}/contents/${item.path}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${Bun.env.GH_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Delete resource ${item.path} as part of project ${projectSlug} cleanup`,
              sha: item.sha,
              branch: 'main',
            }),
          });
        }
      }
    }

    console.log(`Successfully deleted project ${projectSlug} from GitHub`);
  } catch (error) {
    console.error(`Error deleting project ${projectSlug} from GitHub:`, error);
    throw error;
  }
}
