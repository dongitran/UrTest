const path = require("path");
const fs = require("fs-extra");
const { exec, spawn } = require("child_process");
const util = require("util");
const minioService = require("./minioService");
const config = require("../config");

const execPromise = util.promisify(exec);

const startXvfb = async () => {
  try {
    const checkResult = await execPromise(
      'ps aux | grep "Xvfb :99" | grep -v grep'
    );
    if (checkResult.stdout.trim()) {
      console.log("Xvfb already running");
      return true;
    }
  } catch (error) {
    try {
      await execPromise("Xvfb :99 -screen 0 1280x1024x24 -ac &");
      console.log("Started Xvfb");
      return true;
    } catch (error) {
      console.error("Failed to start Xvfb:", error);
      return false;
    }
  }
};

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

function containsUITest(content) {
  return (
    content.includes("SeleniumLibrary") ||
    content.includes("Open Browser") ||
    content.includes("Browser Library")
  );
}

exports.runTest = async (requestId, project, content, testResultTitle) => {
  try {
    let decodedContent;
    try {
      decodedContent = Buffer.from(content, "base64").toString("utf-8");
    } catch (error) {
      throw new Error("Invalid base64 content");
    }

    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    const projectPath = path.join(repoPath, "tests", project);
    const testFilePath = path.join(projectPath, `${testResultTitle}.robot`);

    await fs.ensureDir(projectPath);

    const formattedContent = decodedContent.replace(/\n/g, "\n");
    await fs.writeFile(testFilePath, formattedContent);

    const isUITest = containsUITest(formattedContent);

    if (isUITest) {
      console.log("Detected UI test, ensuring Xvfb is running");
      await startXvfb();
    }

    const robotEnv = {
      ...process.env,
      DISPLAY: ":99",
      PYTHONPATH: process.cwd(),
    };

    let robotOptions = [];

    if (isUITest) {
      robotOptions.push("--variable");
      robotOptions.push("BROWSER:headlesschrome");
    }

    robotOptions.push(`tests/tests/${project}/${testResultTitle}.robot`);

    console.log(`Running robot command: robot ${robotOptions.join(" ")}`);

    let stdout = "",
      stderr = "";

    try {
      const robotProcess = spawn("robot", robotOptions, { env: robotEnv });

      robotProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        console.log(chunk);
      });

      robotProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        console.error(chunk);
      });

      await new Promise((resolve, reject) => {
        robotProcess.on("close", (code) => {
          console.log(`Robot process exited with code ${code}`);
          resolve();
        });

        robotProcess.on("error", (err) => {
          console.error(`Failed to start robot process: ${err}`);
          reject(err);
        });
      });
    } catch (error) {
      console.error("Error running robot command:", error);
      stdout = error.stdout || "";
      stderr = error.stderr || "";
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
      {
        name: "selenium-screenshot-1.png",
        path: path.join(process.cwd(), "selenium-screenshot-1.png"),
      },
    ];

    const minioFolder = `manual-running/${requestId}`;

    for (const file of reportFiles) {
      if (await fs.pathExists(file.path)) {
        await minioService.uploadFile(file.path, `${minioFolder}/${file.name}`);
      }
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return {
      reportUrl,
      results: testResults,
      isUITest,
    };
  } catch (error) {
    console.error("Error executing test:", error);
    throw error;
  }
};
