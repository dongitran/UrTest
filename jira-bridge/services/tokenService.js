const db = require("../config/db");
const axios = require("axios");

const tokenService = {
  async saveToken(userData) {
    const {
      user_id,
      user_name,
      user_email,
      access_token,
      refresh_token,
      token_expires_at,
      cloud_id,
      cloud_name,
      cloud_url,
      scopes,
      email,
    } = userData;

    try {
      let existingUser = null;

      if (email) {
        existingUser = await db.oneOrNone(
          "SELECT id FROM oauth_tokens WHERE user_email = $1 AND deleted_at IS NULL",
          [email]
        );
      } else if (user_id) {
        existingUser = await db.oneOrNone(
          "SELECT id FROM oauth_tokens WHERE user_id = $1 AND deleted_at IS NULL",
          [user_id]
        );
      }

      if (existingUser) {
        return db.one(
          `
          UPDATE oauth_tokens 
          SET 
          user_name = $2,
          user_email = $3,
          access_token = $4,
          refresh_token = $5,
          token_expires_at = $6,
          cloud_id = $7,
          cloud_name = $8,
          cloud_url = $9,
          scopes = $10,
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING *
          `,
          [
            existingUser.id,
            user_name,
            email || user_email,
            access_token,
            refresh_token,
            token_expires_at,
            cloud_id,
            cloud_name,
            cloud_url,
            scopes,
          ]
        );
      } else {
        return db.one(
          `
          INSERT INTO oauth_tokens(
          user_id, 
          user_name, 
          user_email, 
          access_token, 
          refresh_token, 
          token_expires_at, 
          cloud_id, 
          cloud_name, 
          cloud_url, 
          scopes
          )
          VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
          `,
          [
            user_id,
            user_name,
            email || user_email,
            access_token,
            refresh_token,
            token_expires_at,
            cloud_id,
            cloud_name,
            cloud_url,
            scopes,
          ]
        );
      }
    } catch (error) {
      console.error("Error saving token:", error);
      throw error;
    }
  },

  async getTokenByUserId(user_id) {
    try {
      return await db.oneOrNone(
        "SELECT * FROM oauth_tokens WHERE user_id = $1 AND deleted_at IS NULL",
        [user_id]
      );
    } catch (error) {
      console.error("Error getting token by user_id:", error);
      throw error;
    }
  },

  async getTokenByEmail(email) {
    try {
      return await db.oneOrNone(
        "SELECT * FROM oauth_tokens WHERE user_email = $1 AND deleted_at IS NULL",
        [email]
      );
    } catch (error) {
      console.error("Error getting token by email:", error);
      throw error;
    }
  },

  async refreshTokenByUserId(user_id) {
    try {
      const tokenData = await this.getTokenByUserId(user_id);

      if (!tokenData || !tokenData.refresh_token) {
        throw new Error("No token found or refresh token missing");
      }

      const response = await axios.post(
        "https://auth.atlassian.com/oauth/token",
        {
          grant_type: "refresh_token",
          client_id: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_ID,
          client_secret: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const token_expires_at = Date.now() + expires_in * 1000;

      return this.updateToken(
        user_id,
        access_token,
        refresh_token,
        token_expires_at
      );
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  },

  async refreshTokenByEmail(email) {
    try {
      const tokenData = await this.getTokenByEmail(email);

      if (!tokenData || !tokenData.refresh_token) {
        throw new Error("No token found or refresh token missing");
      }

      const response = await axios.post(
        "https://auth.atlassian.com/oauth/token",
        {
          grant_type: "refresh_token",
          client_id: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_ID,
          client_secret: process.env.JIRA_BRIDGE_ATLASSIAN_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const token_expires_at = Date.now() + expires_in * 1000;

      return this.updateTokenByEmail(
        email,
        access_token,
        refresh_token,
        token_expires_at
      );
    } catch (error) {
      console.error("Error refreshing token by email:", error);
      throw error;
    }
  },

  async updateToken(user_id, access_token, refresh_token, token_expires_at) {
    try {
      return await db.one(
        `
        UPDATE oauth_tokens 
        SET 
        access_token = $2,
        refresh_token = CASE WHEN $3 IS NULL THEN refresh_token ELSE $3 END,
        token_expires_at = $4,
        updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND deleted_at IS NULL
        RETURNING *
        `,
        [user_id, access_token, refresh_token, token_expires_at]
      );
    } catch (error) {
      console.error("Error updating token:", error);
      throw error;
    }
  },

  async updateTokenByEmail(
    email,
    access_token,
    refresh_token,
    token_expires_at
  ) {
    try {
      return await db.one(
        `
        UPDATE oauth_tokens 
        SET 
        access_token = $2,
        refresh_token = CASE WHEN $3 IS NULL THEN refresh_token ELSE $3 END,
        token_expires_at = $4,
        updated_at = CURRENT_TIMESTAMP
        WHERE user_email = $1 AND deleted_at IS NULL
        RETURNING *
        `,
        [email, access_token, refresh_token, token_expires_at]
      );
    } catch (error) {
      console.error("Error updating token by email:", error);
      throw error;
    }
  },

  async deleteToken(user_id) {
    try {
      await db.none(
        "UPDATE oauth_tokens SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND deleted_at IS NULL",
        [user_id]
      );
    } catch (error) {
      console.error("Error deleting token:", error);
      throw error;
    }
  },

  async deleteTokenByEmail(email) {
    try {
      await db.none(
        "UPDATE oauth_tokens SET deleted_at = CURRENT_TIMESTAMP WHERE user_email = $1 AND deleted_at IS NULL",
        [email]
      );
    } catch (error) {
      console.error("Error deleting token by email:", error);
      throw error;
    }
  },
};

module.exports = tokenService;
