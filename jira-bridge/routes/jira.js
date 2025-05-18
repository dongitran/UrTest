const express = require("express");
const axios = require("axios");
const router = express.Router();
const tokenService = require("../services/tokenService");

function generateRandomState() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

router.get("/jira", (req, res) => {
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

  const state = generateRandomState();

  const authorizeUrl =
    `https://auth.atlassian.com/authorize?` +
    `audience=api.atlassian.com&` +
    `client_id=${process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes.join(" "))}&` +
    `redirect_uri=${encodeURIComponent(process.env.JIRA_BRIDGE_REDIRECT_URI)}&` +
    `state=${state}&` +
    `response_type=code&` +
    `prompt=consent`;

  req.session.auth_state = state;
  res.redirect(authorizeUrl);
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.auth_state) {
    return res.status(403).render("error", {
      message: "State mismatch.",
    });
  }

  try {
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

    if (!req.cookies.user_id) {
      req.user_id =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      res.cookie("user_id", req.user_id, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.JIRA_BRIDGE_NODE_ENV === "production",
      });
    } else {
      req.user_id = req.cookies.user_id;
    }

    await tokenService.saveToken({
      user_id: req.user_id,
      ...userData,
      access_token,
      refresh_token,
      token_expires_at,
      ...resourceData,
      email: req.session.email,
    });

    if (req.session.callback_url) {
      const callbackUrl = req.session.callback_url;
      const email = req.session.email || "";

      delete req.session.callback_url;
      delete req.session.keycloak_access_token;

      return res.redirect(
        `${callbackUrl}?status=success&email=${encodeURIComponent(email)}`
      );
    }

    res.redirect("/");
  } catch (error) {
    console.error("OAuth Error:", error.response?.data || error.message);

    if (req.session.callback_url) {
      const callbackUrl = req.session.callback_url;

      delete req.session.callback_url;
      delete req.session.keycloak_access_token;

      return res.redirect(
        `${callbackUrl}?status=error&message=${encodeURIComponent(
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
