const path = require("path");
const fs = require("fs-extra");
const { exec } = require("child_process");
const util = require("util");
const minioService = require("./minioService");
const config = require("../config");

const execPromise = util.promisify(exec);

function extractTestResults(stdout) {
  try {
    const resultMatch = stdout.match(
      /(\d+) tests?, (\d+) passed, (\d+) failed/
    );

    if (resultMatch) {
      return {
        totalTests: parseInt(resultMatch[1], 10),
        passed: parseInt(resultMatch[2], 10),
        failed: parseInt(resultMatch[3], 10),
      };
    }

    return {
      totalTests: 0,
      passed: 0,
      failed: 0,
    };
  } catch (error) {
    console.error("Error extracting test results:", error);
    return {
      totalTests: 0,
      passed: 0,
      failed: 0,
    };
  }
}

exports.runTest = async (requestId, project, content, testResultTitle) => {
  let testFilePath = "";
  try {
    let decodedContent;
    try {
      decodedContent = Buffer.from(content, "base64").toString("utf-8");
    } catch (error) {
      throw new Error("Invalid base64 content");
    }

    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    const projectPath = path.join(repoPath, "tests", project);
    const fileName = testResultTitle || `test_${Date.now()}`;
    testFilePath = path.join(projectPath, `${fileName}.robot`);

    await fs.ensureDir(projectPath);

    const formattedContent = decodedContent.replace(/\n/g, "\n");
    await fs.writeFile(testFilePath, formattedContent);

    const robotCommand = `robot tests/tests/${project}/${fileName}.robot`;

    let stdout, stderr;
    try {
      const result = await execPromise(robotCommand);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      stdout = error.stdout;
      stderr = error.stderr;
      console.error("Error running test:", error);
    }
    console.log({ stdout, stderr }, "output");

    if (stderr) {
      console.error("Robot test stderr:", stderr);
    }

    const testResults = extractTestResults(stdout);

    const reportFiles = [
      { name: "report.html", path: path.join(process.cwd(), "report.html") },
      { name: "log.html", path: path.join(process.cwd(), "log.html") },
      { name: "output.xml", path: path.join(process.cwd(), "output.xml") },
    ];

    const minioFolder = `manual-running/${requestId}`;

    for (const file of reportFiles) {
      if (await fs.pathExists(file.path)) {
        await minioService.uploadFile(file.path, `${minioFolder}/${file.name}`);
      }
    }

    if (await fs.pathExists(testFilePath)) {
      await fs.remove(testFilePath);
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return {
      reportUrl,
      results: testResults,
    };
  } catch (error) {
    console.error("Error executing test:", error);
    if (testFilePath && (await fs.pathExists(testFilePath))) {
      try {
        await fs.remove(testFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up test file:", cleanupError);
      }
    }
    throw error;
  }
};

exports.runProjectTests = async (requestId, project) => {
  try {
    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    const projectPath = path.join(repoPath, "tests", project);

    if (!(await fs.pathExists(projectPath))) {
      throw new Error(`Project folder ${project} does not exist`);
    }

    const files = await fs.readdir(projectPath);
    const robotFiles = files.filter((file) => file.endsWith(".robot"));

    if (robotFiles.length === 0) {
      throw new Error(`No robot files found in project ${project}`);
    }

    const robotCommand = `robot tests/tests/${project}`;

    let stdout, stderr;
    try {
      const result = await execPromise(robotCommand);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      stdout = error.stdout;
      stderr = error.stderr;
      console.error("Error running project tests:", error);
    }

    console.log({ stdout, stderr }, "project-tests-output");

    if (stderr) {
      console.error("Robot project tests stderr:", stderr);
    }

    const testResults = extractTestResults(stdout);

    const reportFiles = [
      { name: "report.html", path: path.join(process.cwd(), "report.html") },
      { name: "log.html", path: path.join(process.cwd(), "log.html") },
      { name: "output.xml", path: path.join(process.cwd(), "output.xml") },
    ];

    const minioFolder = `project-running/${requestId}`;

    for (const file of reportFiles) {
      if (await fs.pathExists(file.path)) {
        await minioService.uploadFile(file.path, `${minioFolder}/${file.name}`);
      }
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return {
      reportUrl,
      results: testResults,
      totalFiles: robotFiles.length,
    };
  } catch (error) {
    console.error("Error executing project tests:", error);
    throw error;
  }
};
