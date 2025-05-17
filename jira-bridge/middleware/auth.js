const tokenService = require("../services/tokenService");
const { v4: uuidv4 } = require("uuid");

exports.setUserCookie = (req, res, next) => {
  if (!req.cookies.user_id) {
    const user_id = uuidv4();
    res.cookie("user_id", user_id, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.JIRA_BRIDGE_NODE_ENV === "production",
      sameSite: "lax",
    });
    req.user_id = user_id;
  } else {
    req.user_id = req.cookies.user_id;
  }
  next();
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const user_id = req.cookies.user_id;

    if (!user_id) {
      return res.redirect("/auth/jira");
    }

    const tokenData = await tokenService.getTokenByUserId(user_id);

    if (!tokenData) {
      return res.redirect("/auth/jira");
    }

    const now = Date.now();
    const tokenExpiresAt = parseInt(tokenData.token_expires_at);
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (tokenExpiresAt - now < fiveMinutesInMs) {
      try {
        const refreshedToken = await tokenService.refreshTokenByUserId(user_id);

        req.jiraToken = {
          access_token: refreshedToken.access_token,
          refresh_token: refreshedToken.refresh_token,
          expires_at: refreshedToken.token_expires_at,
        };
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return res.redirect("/auth/jira");
      }
    } else {
      req.jiraToken = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.token_expires_at,
      };
    }

    req.user = {
      id: tokenData.user_id,
      name: tokenData.user_name,
      email: tokenData.user_email,
    };

    req.jiraResource = {
      id: tokenData.cloud_id,
      name: tokenData.cloud_name,
      url: tokenData.cloud_url,
      scopes: tokenData.scopes,
    };

    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(500).render("error", {
      message: "Authenticated error: " + error.message,
    });
  }
};
