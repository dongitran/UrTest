require("dotenv").config();
const express = require("express");
const path = require("path");
const { processKeywords, findProjects } = require("./processor");
const fs = require("fs-extra");
const { fetchRobotFrameworkFiles } = require("./github");

function createApiServer() {
  const app = express();
  const apiKey = process.env.API_KEY;

  function validateApiKey(req, res, next) {
    const headerApiKey = req.headers["x-api-key"];

    if (!headerApiKey || headerApiKey !== apiKey) {
      return res.status(401).json({ error: "Unauthorized - Invalid API key" });
    }

    next();
  }

  app.use(express.json());

  app.post("/api/extract-keywords", validateApiKey, async (req, res) => {
    res.status(202).json({
      message: "Keyword extraction process started",
      status: "processing",
    });

    try {
      setTimeout(async () => {
        try {
          console.log(
            `Starting keyword extraction process at ${new Date().toISOString()}`
          );

          const tempDir = path.join(__dirname, "../temp");
          const outputDir = path.join(__dirname, "../output");

          await fs.remove(tempDir);
          await fs.remove(outputDir);

          await fs.ensureDir(tempDir);
          await fs.ensureDir(outputDir);

          const repoDir = await fetchRobotFrameworkFiles(tempDir);

          await processKeywords(repoDir, outputDir, null);

          const projects = await findProjects(repoDir);
          console.log(
            `Found ${projects.length} projects: ${projects.join(", ")}`
          );

          for (const project of projects) {
            await processKeywords(repoDir, outputDir, project);
          }

          console.log(
            `Keyword extraction process completed at ${new Date().toISOString()}`
          );
        } catch (error) {
          console.error("Error in background extraction process:", error);
        }
      }, 0);
    } catch (error) {
      console.error("Error starting background process:", error);
    }
  });

  return app;
}

module.exports = { createApiServer };
