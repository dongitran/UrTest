const express = require("express");
const router = express.Router();
const tokenService = require("../services/tokenService");
const jiraService = require("../services/jiraService");
const linkService = require("../services/linkService");
const apiKeyAuth = require("../middleware/apiKeyAuth");

router.use(apiKeyAuth);

router.get("/check-email-linked", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email parameter is required",
      });
    }

    const token = await tokenService.getTokenByEmail(email);

    return res.json({
      status: "success",
      isLinked: !!token,
      email,
    });
  } catch (error) {
    console.error("Error checking email link status:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while checking email link status",
    });
  }
});

router.post("/register-remote-link", async (req, res) => {
  try {
    const { email, issueKey, object, application, testSuiteId } = req.body;

    if (!email || !issueKey || !object || !application || !testSuiteId) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required fields: email, issueKey, object, application, or testSuiteId",
      });
    }

    if (!object.url || !object.title) {
      return res.status(400).json({
        status: "error",
        message: "Object must contain url and title",
      });
    }

    if (!application.name || !application.type) {
      return res.status(400).json({
        status: "error",
        message: "Application must contain name and type",
      });
    }

    const linkResult = await linkService.checkAndCreateLink(
      issueKey,
      testSuiteId,
      application.type,
      application.name,
      email
    );

    if (!linkResult.isNew) {
      const existingLinks = await jiraService.getRemoteLinks(email, issueKey);
      const duplicateLink = existingLinks.find(
        (link) => link.object && link.object.url === object.url
      );

      if (duplicateLink) {
        return res.json({
          status: "success",
          message:
            "Remote link already exists for this test suite on this issue",
          data: duplicateLink,
        });
      }
    }

    const result = await jiraService.createRemoteLink(
      email,
      issueKey,
      object,
      application
    );

    return res.json({
      status: "success",
      message: linkResult.isNew
        ? "Remote link has been created successfully"
        : "Remote link has been updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error registering remote link:", error);

    return res.status(500).json({
      status: "error",
      message:
        error.message || "An error occurred while registering remote link",
    });
  }
});

router.delete("/remove-remote-link", async (req, res) => {
  try {
    const { email, issueKey, testSuiteId } = req.body;

    if (!email || !issueKey || !testSuiteId) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: email, issueKey, or testSuiteId",
      });
    }

    await linkService.deleteLink(issueKey, testSuiteId, email);

    return res.json({
      status: "success",
      message: "Remote link has been deleted successfully",
    });
  } catch (error) {
    console.error("Error removing remote link:", error);

    return res.status(500).json({
      status: "error",
      message: error.message || "An error occurred while removing remote link",
    });
  }
});

router.get("/my-assigned-tasks", async (req, res) => {
  try {
    const { email, status, project, maxResults, startAt, excludeStatuses } =
      req.query;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email parameter is required",
      });
    }

    const token = await tokenService.getTokenByEmail(email);
    if (!token) {
      return res.status(401).json({
        status: "error",
        message:
          "No valid Jira token found for this email. Please link your Jira account first.",
      });
    }

    let excludeStatusesArray = [];
    if (excludeStatuses) {
      if (typeof excludeStatuses === "string") {
        excludeStatusesArray = excludeStatuses
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      } else if (Array.isArray(excludeStatuses)) {
        excludeStatusesArray = excludeStatuses;
      }
    }

    const options = {
      status,
      project,
      excludeStatuses: excludeStatusesArray,
      maxResults: maxResults ? parseInt(maxResults) : 50,
      startAt: startAt ? parseInt(startAt) : 0,
    };

    const result = await jiraService.getAssignedTasks(email, options);

    return res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error getting assigned tasks:", error);

    return res.status(500).json({
      status: "error",
      message:
        error.message || "An error occurred while fetching assigned tasks",
    });
  }
});

module.exports = router;
