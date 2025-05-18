const keycloakService = require("../services/keycloakService");

const keycloakAuth = async (req, res, next) => {
  try {
    const { access_token } = req.query;

    if (!access_token) {
      return res.status(401).render("error", {
        message: "Access token not found. Please provide the token in the URL.",
      });
    }

    try {
      const tokenData = await keycloakService.verifyToken(access_token);

      req.keycloakUser = tokenData;
      req.session.email =
        req.query.email || tokenData.email || tokenData.preferred_username;
      req.session.callback_url = req.query.callback_url;
      req.session.keycloak_access_token = access_token;

      next();
    } catch (tokenError) {
      console.error("Invalid token:", tokenError);

      return res.status(401).render("error", {
        message: "Invalid access token. Please log in again.",
      });
    }
  } catch (error) {
    console.error("Keycloak authentication error:", error);
    res.status(500).render("error", {
      message: "An error occurred while authenticating with Keycloak.",
    });
  }
};

module.exports = keycloakAuth;
