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
    const { email, issueKey, object, application } = req.body;

    if (!email || !issueKey || !object || !application) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required fields: email, issueKey, object, or application",
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

    const testSuiteUrl = object.url;

    const linkResult = await linkService.checkAndCreateLink(
      issueKey,
      testSuiteUrl,
      application.type,
      application.name,
      email
    );

    if (!linkResult.isNew) {
      const existingLinks = await jiraService.getRemoteLinks(email, issueKey);
      const duplicateLink = existingLinks.find(
        (link) => link.object && link.object.url === testSuiteUrl
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
    const { email, issueKey, testSuiteUrl } = req.body;

    if (!email || !issueKey || !testSuiteUrl) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: email, issueKey, or testSuiteUrl",
      });
    }

    await linkService.deleteLink(issueKey, testSuiteUrl, email);

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

module.exports = router;
