const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

const git = simpleGit();

exports.cloneRepository = async () => {
  try {
    const repoUrl = config.GITHUB_REPO.replace('https://', `https://${config.GITHUB_TOKEN}@`);
    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    
    if (fs.existsSync(repoPath)) {
      await fs.remove(repoPath);
    }
    
    await fs.ensureDir(repoPath);
    await git.clone(repoUrl, repoPath);
    
    console.log('Repository cloned successfully');
    return repoPath;
  } catch (error) {
    console.error('Failed to clone repository:', error);
    throw error;
  }
};
