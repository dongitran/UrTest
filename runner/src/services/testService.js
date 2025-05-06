const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const util = require('util');
const minioService = require('./minioService');
const config = require('../config');

const execPromise = util.promisify(exec);

exports.runTest = async (requestId, project, content) => {
  try {
    let decodedContent;
    try {
      decodedContent = Buffer.from(content, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error('Invalid base64 content');
    }

    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    const projectPath = path.join(repoPath, 'tests', project);
    const testFilePath = path.join(projectPath, 'run-test-tmp.robot');

    await fs.ensureDir(projectPath);

    const formattedContent = decodedContent.replace(/\n/g, '\n');
    await fs.writeFile(testFilePath, formattedContent);

    const robotCommand = `robot tests/tests/${project}/run-test-tmp.robot`;

    let stdout, stderr;
    try {
      const result = await execPromise(robotCommand);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      stdout = error.stdout;
      stderr = error.stderr;
      console.error('Error running test:', error);
    }

    if (stderr) {
      console.error('Robot test stderr:', stderr);
    }

    const reportFiles = [
      { name: 'report.html', path: path.join(process.cwd(), 'report.html') },
      { name: 'log.html', path: path.join(process.cwd(), 'log.html') },
      { name: 'output.xml', path: path.join(process.cwd(), 'output.xml') }
    ];

    const minioFolder = `manual-running/${requestId}`;

    for (const file of reportFiles) {
      if (await fs.pathExists(file.path)) {
        await minioService.uploadFile(file.path, `${minioFolder}/${file.name}`);
      }
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return { reportUrl };
  } catch (error) {
    console.error('Error executing test:', error);
    throw error;
  }
};