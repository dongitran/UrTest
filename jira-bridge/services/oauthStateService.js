const db = require("../config/db");

const oauthStateService = {
  generateState() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  },

  async saveState(stateData, expiresInMinutes = 15) {
    try {
      const { state, email, callback_url, keycloak_access_token, user_id } =
        stateData;

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      const result = await db.one(
        `INSERT INTO oauth_states (
          state, email, callback_url, keycloak_access_token, user_id, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [state, email, callback_url, keycloak_access_token, user_id, expiresAt]
      );

      return result;
    } catch (error) {
      console.error("Error saving OAuth state:", error);
      throw error;
    }
  },

  async getAndValidateState(state) {
    try {
      const stateData = await db.oneOrNone(
        `SELECT * FROM oauth_states 
          WHERE state = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL`,
        [state]
      );

      if (!stateData) {
        return null;
      }

      await db.none(
        `UPDATE oauth_states 
          SET used_at = CURRENT_TIMESTAMP 
          WHERE id = $1`,
        [stateData.id]
      );

      return stateData;
    } catch (error) {
      console.error("Error getting OAuth state:", error);
      throw error;
    }
  },

  async deleteState(state) {
    try {
      await db.none("DELETE FROM oauth_states WHERE state = $1", [state]);
    } catch (error) {
      console.error("Error deleting OAuth state:", error);
      throw error;
    }
  },
};

module.exports = oauthStateService;
