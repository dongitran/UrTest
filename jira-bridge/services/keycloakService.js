const axios = require("axios");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
  jwksUri: `${process.env.JIRA_BRIDGE_KEYCLOAK_URL}/realms/${process.env.JIRA_BRIDGE_KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const keycloakService = {
  verifyToken: async (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await axios.post(
        `${process.env.JIRA_BRIDGE_KEYCLOAK_URL}/realms/${process.env.JIRA_BRIDGE_KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.JIRA_BRIDGE_KEYCLOAK_CLIENT_ID,
          refresh_token: refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error refreshing Keycloak token:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getUserInfo: async (token) => {
    try {
      const response = await axios.get(
        `${process.env.JIRA_BRIDGE_KEYCLOAK_URL}/realms/${process.env.JIRA_BRIDGE_KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error getting user info from Keycloak:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

module.exports = keycloakService;
