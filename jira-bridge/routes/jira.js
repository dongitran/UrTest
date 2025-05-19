const express = require("express");
const axios = require("axios");
const router = express.Router();
const tokenService = require("../services/tokenService");
const oauthStateService = require("../services/oauthStateService");

router.get("/jira", async (req, res) => {
  try {
    const scopes = [
      "read:jira-user",
      "read:jira-work",
      "write:jira-work",
      "offline_access",
      "read:issue.remote-link:jira",
      "write:issue.remote-link:jira",
      "delete:issue.remote-link:jira",
      "read:remote-link-info:jira",
      "write:remote-link-info:jira",
      "delete:remote-link-info:jira",
    ];

    const state = oauthStateService.generateState();

    const stateData = {
      state,
      email: req.session.email,
      callback_url: req.session.callback_url,
      keycloak_access_token: req.session.keycloak_access_token,
      user_id: req.user_id || null,
    };

    await oauthStateService.saveState(stateData, 15);

    const authorizeUrl =
      `https://auth.atlassian.com/authorize?` +
      `audience=api.atlassian.com&` +
      `client_id=${process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_ID}&` +
      `scope=${encodeURIComponent(scopes.join(" "))}&` +
      `redirect_uri=${encodeURIComponent(
        process.env.JIRA_BRIDGE_REDIRECT_URI
      )}&` +
      `state=${state}&` +
      `response_type=code&` +
      `prompt=consent`;

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error("Error in /auth/jira route:", error);
    res.status(500).render("error", {
      message: "Error initiating Jira authentication: " + error.message,
    });
  }
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    const stateData = await oauthStateService.getAndValidateState(state);
    console.log(stateData, 'stateData')

    if (!stateData) {
      return res.status(403).render("error", {
        message: "State mismatch or expired. Please try again.",
      });
    }

    const { email, callback_url, user_id } = stateData;

    const tokenResponse = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_ID,
        client_secret: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: process.env.JIRA_BRIDGE_REDIRECT_URI,
      }
    );
    console.log(tokenResponse, 'tokenResponse')

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const token_expires_at = Date.now() + expires_in * 1000;

    const resourcesResponse = await axios.get(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    console.log(resourcesResponse, 'resourcesResponse')

    let userData = { user_name: null, user_email: null };
    try {
      const userResponse = await axios.get("https://api.atlassian.com/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      userData = {
        user_name: userResponse.data.name || userResponse.data.displayName,
        user_email: userResponse.data.email,
      };
    } catch (userError) {
      console.error("Error fetching user info:", userError.message);
    }
    console.log(userData, 'userData')

    let resourceData = {};
    if (resourcesResponse.data && resourcesResponse.data.length > 0) {
      const resource = resourcesResponse.data[0];
      resourceData = {
        cloud_id: resource.id,
        cloud_name: resource.name,
        cloud_url: resource.url,
        scopes: resource.scopes,
      };
    }

    let finalUserId = user_id;
    if (!finalUserId) {
      if (!req.cookies.user_id) {
        finalUserId =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        res.cookie("user_id", finalUserId, {
          maxAge: 365 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: process.env.JIRA_BRIDGE_NODE_ENV === "production",
        });
      } else {
        finalUserId = req.cookies.user_id;
      }
    }

    await tokenService.saveToken({
      user_id: finalUserId,
      ...userData,
      access_token,
      refresh_token,
      token_expires_at,
      ...resourceData,
      email: email,
    });

    if (callback_url) {
      const redirectEmail = email || "";
      return res.redirect(
        `${callback_url}?status=success&email=${encodeURIComponent(
          redirectEmail
        )}`
      );
    }

    res.redirect("/");
  } catch (error) {
    console.error("OAuth Error:", error.response?.data || error.message);

    let callback_url = null;
    if (req.session && req.session.callback_url) {
      callback_url = req.session.callback_url;
      delete req.session.callback_url;
    }

    if (callback_url) {
      return res.redirect(
        `${callback_url}?status=error&message=${encodeURIComponent(
          "Authentication failed with Jira: " + error.message
        )}`
      );
    }

    res.status(500).render("error", {
      message: "Authentication failed with Jira: " + error.message,
    });
  }
});

router.get("/logout", async (req, res) => {
  try {
    const user_id = req.cookies.user_id;
    if (user_id) {
      await tokenService.deleteToken(user_id);
      res.clearCookie("user_id");
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  res.redirect("/");
});

module.exports = router;
