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
      return true;
    }
  } catch (error) {
    try {
      await execPromise("Xvfb :99 -screen 0 1280x1024x24 -ac &");
      return true;
    } catch (error) {
      return false;
    }
  }
};

const checkWebDriver = async () => {
  try {
    await execPromise("chromedriver --version");
    await execPromise("chmod +x $(which chromedriver)");
    return true;
  } catch (error) {
    try {
      await execPromise("webdrivermanager chrome --linkpath /usr/local/bin");
      return true;
    } catch (installError) {
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
    return {
      totalTests: 0,
      passed: 0,
      failed: 0,
    };
  }
}

function extractProjectTestResults(stdout, project) {
  try {
    const formattedProject = project
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("-");

    const overallResultPattern = new RegExp(
      `${formattedProject}\\s+\\| PASS \\|\\s*\\n(\\d+) tests?, (\\d+) passed, (\\d+) failed`
    );

    const overallResultMatch = stdout.match(overallResultPattern);

    if (!overallResultMatch) {
      return extractTestResults(stdout);
    }

    const overallResults = {
      totalTests: parseInt(overallResultMatch[1], 10),
      passed: parseInt(overallResultMatch[2], 10),
      failed: parseInt(overallResultMatch[3], 10),
    };

    const suitePattern = new RegExp(
      `${formattedProject}\\.(\\S+)\\s+\\| PASS \\|\\s*\\n(\\d+) tests?, (\\d+) passed, (\\d+) failed`,
      "g"
    );

    const testSuites = [];
    let match;

    while ((match = suitePattern.exec(stdout)) !== null) {
      const suiteId = match[1];
      const totalTests = parseInt(match[2], 10);
      const passed = parseInt(match[3], 10);
      const failed = parseInt(match[4], 10);

      const suiteHeaderPattern = new RegExp(
        `==+\\s*\\n${formattedProject}\\.${suiteId}[^\\n]*\\s*\\n==+`,
        "m"
      );

      const headerMatch = stdout.match(suiteHeaderPattern);

      let title = suiteId;

      if (headerMatch) {
        const headerPos = stdout.indexOf(headerMatch[0]);
        const headerEnd = headerPos + headerMatch[0].length;

        const nextLines = stdout.substring(headerEnd).split("\n");
        for (const line of nextLines) {
          if (line.includes("| PASS |") || line.includes("| FAIL |")) {
            title = line.split("|")[0].trim();
            break;
          }
        }
      }

      testSuites.push({
        title,
        totalTests,
        passed,
        failed,
      });
    }

    return {
      ...overallResults,
      projectDetail: {
        totalTestSuites: testSuites.length,
        details: testSuites,
      },
    };
  } catch (error) {
    console.error("Error extracting project test results:", error);
    return extractTestResults(stdout);
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
  const tempFilesToCleanup = [];

  try {
    let decodedContent;
    try {
      decodedContent = Buffer.from(content, "base64").toString("utf-8");
    } catch (error) {
      throw new Error("Invalid base64 content");
    }

    const repoPath = path.join(process.cwd(), config.REPO_FOLDER);
    const projectPath = path.join(repoPath, "tests", project);
    const testFilePath = path.join(
      projectPath,
      `${testResultTitle || "test"}.robot`
    );

    tempFilesToCleanup.push(testFilePath);

    await fs.ensureDir(projectPath);

    const formattedContent = decodedContent.replace(/\n/g, "\n");
    await fs.writeFile(testFilePath, formattedContent);

    const isUITest = containsUITest(formattedContent);

    if (isUITest) {
      await startXvfb();
      await checkWebDriver();

      try {
        const chromeVersion = await execPromise("chromium-browser --version");
        const driverVersion = await execPromise("chromedriver --version");
        const driverPath = await execPromise("which chromedriver");
        await execPromise(`chmod +x ${driverPath.stdout.trim()}`);
      } catch (error) {}
    }

    const robotEnv = {
      ...process.env,
      DISPLAY: ":99",
      PYTHONPATH: process.cwd(),
      PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin`,
      SELENIUM_DRIVER_PATH: "/usr/bin/chromedriver",
    };

    let robotOptions = [];

    if (isUITest) {
      robotOptions.push("--variable");
      robotOptions.push("BROWSER:headlesschrome");

      const setupFile = path.join(
        projectPath,
        `${testResultTitle || "test"}_setup.robot`
      );

      tempFilesToCleanup.push(setupFile);

      await fs.writeFile(
        setupFile,
        `
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
\${SELENIUM_DRIVER_PATH}    /usr/bin/chromedriver
\${BROWSER_OPTIONS}    add_argument("--no-sandbox");add_argument("--disable-dev-shm-usage");add_argument("--disable-gpu")

*** Keywords ***
Setup ChromeDriver
    Set Environment Variable    webdriver.chrome.driver    \${SELENIUM_DRIVER_PATH}
`
      );

      robotOptions.push("--prerunmodifier");
      robotOptions.push(
        `${projectPath}/${testResultTitle || "test"}_setup.robot`
      );
    }

    robotOptions.push(
      `tests/tests/${project}/${testResultTitle || "test"}.robot`
    );

    let stdout = "",
      stderr = "";

    try {
      const robotProcess = spawn("robot", robotOptions, { env: robotEnv });

      robotProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
      });

      robotProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
      });

      await new Promise((resolve, reject) => {
        robotProcess.on("close", (code) => {
          resolve();
        });

        robotProcess.on("error", (err) => {
          reject(err);
        });
      });
    } catch (error) {
      stdout = error.stdout || "";
      stderr = error.stderr || "";
    }

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

    try {
      const files = await fs.readdir(process.cwd());
      const screenshotFiles = files.filter(
        (file) =>
          file.startsWith("selenium-screenshot-") && file.endsWith(".png")
      );

      for (const screenshotFile of screenshotFiles) {
        const screenshotPath = path.join(process.cwd(), screenshotFile);
        if (await fs.pathExists(screenshotPath)) {
          await minioService.uploadFile(
            screenshotPath,
            `${minioFolder}/${screenshotFile}`
          );
          console.log(`Uploaded screenshot: ${screenshotFile}`);

          await fs.remove(screenshotPath);
          console.log(`Deleted screenshot: ${screenshotFile}`);
        }
      }
    } catch (err) {
      console.error("Error uploading screenshots:", err);
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return {
      reportUrl,
      results: testResults,
      isUITest,
    };
  } catch (error) {
    throw error;
  } finally {
    for (const filePath of tempFilesToCleanup) {
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          console.log(`Temporary file cleaned up: ${filePath}`);
        }
      } catch (cleanupError) {
        console.error(`Error cleaning up file ${filePath}:`, cleanupError);
      }
    }

    try {
      const files = await fs.readdir(process.cwd());
      const remainingScreenshots = files.filter(
        (file) =>
          file.startsWith("selenium-screenshot-") && file.endsWith(".png")
      );

      for (const screenshot of remainingScreenshots) {
        const screenshotPath = path.join(process.cwd(), screenshot);
        await fs.remove(screenshotPath);
        console.log(`Cleaned up remaining screenshot: ${screenshot}`);
      }
    } catch (error) {
      console.error("Error cleaning up remaining screenshots:", error);
    }
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

    if (stderr) {
      console.error("Robot project tests stderr:", stderr);
    }

    const testResults = extractProjectTestResults(stdout, project);

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

    try {
      const files = await fs.readdir(process.cwd());
      const screenshotFiles = files.filter(
        (file) =>
          file.startsWith("selenium-screenshot-") && file.endsWith(".png")
      );

      for (const screenshotFile of screenshotFiles) {
        const screenshotPath = path.join(process.cwd(), screenshotFile);
        if (await fs.pathExists(screenshotPath)) {
          await minioService.uploadFile(
            screenshotPath,
            `${minioFolder}/${screenshotFile}`
          );
          console.log(`Uploaded screenshot: ${screenshotFile}`);

          await fs.remove(screenshotPath);
          console.log(`Deleted screenshot: ${screenshotFile}`);
        }
      }
    } catch (err) {
      console.error("Error uploading screenshots:", err);
    }

    try {
      const files = await fs.readdir(process.cwd());
      const remainingScreenshots = files.filter(
        (file) =>
          file.startsWith("selenium-screenshot-") && file.endsWith(".png")
      );

      for (const screenshot of remainingScreenshots) {
        const screenshotPath = path.join(process.cwd(), screenshot);
        await fs.remove(screenshotPath);
        console.log(`Cleaned up remaining screenshot: ${screenshot}`);
      }
    } catch (error) {
      console.error("Error cleaning up remaining screenshots:", error);
    }

    const reportUrl = `https://${config.MINIO_CONFIG.endPoint}/${config.MINIO_BUCKET}/${minioFolder}`;

    return {
      reportUrl,
      results: testResults.totalTests
        ? testResults
        : { totalTests: 0, passed: 0, failed: 0 },
      projectDetail: testResults.projectDetail,
    };
  } catch (error) {
    console.error("Error executing project tests:", error);
    throw error;
  }
};
