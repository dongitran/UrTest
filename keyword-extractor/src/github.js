const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function fetchRobotFrameworkFiles(tempDir) {
  try {
    const repo = process.env.GH_REPO;
    const token = process.env.GH_TOKEN;

    const repoDir = path.join(tempDir, "repo");
    await fs.remove(repoDir);
    await fs.ensureDir(repoDir);

    let cloneUrl = repo;
    if (token) {
      const urlParts = repo.split("//");
      cloneUrl = `${urlParts[0]}//${token}@${urlParts[1]}`;
    }

    await execPromise(`git clone ${cloneUrl} ${repoDir}`);

    return repoDir;
  } catch (error) {
    console.log("Error fetching Robot Framework files:", error.message);
    throw error;
  }
}

module.exports = {
  fetchRobotFrameworkFiles,
};
