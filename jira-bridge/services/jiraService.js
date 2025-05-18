const axios = require("axios");
const tokenService = require("./tokenService");

const jiraService = {
  getRemoteLinks: async (email, issueKey) => {
    try {
      const tokenData = await tokenService.getTokenByEmail(email);

      if (!tokenData) {
        throw new Error("No token found for the provided email");
      }

      const now = Date.now();
      const tokenExpiresAt = parseInt(tokenData.token_expires_at);
      const fiveMinutesInMs = 5 * 60 * 1000;

      let accessToken = tokenData.access_token;

      if (tokenExpiresAt - now < fiveMinutesInMs) {
        const refreshedToken = await tokenService.refreshTokenByEmail(email);
        accessToken = refreshedToken.access_token;
      }

      const apiUrl = `https://api.atlassian.com/ex/jira/${tokenData.cloud_id}/rest/api/3/issue/${issueKey}/remotelink`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      return response.data || [];
    } catch (error) {
      console.error("Error getting remote links:", error.message);
      throw error;
    }
  },

  createRemoteLink: async (email, issueKey, object, application) => {
    try {
      const tokenData = await tokenService.getTokenByEmail(email);

      if (!tokenData) {
        throw new Error("No token found for the provided email");
      }

      const now = Date.now();
      const tokenExpiresAt = parseInt(tokenData.token_expires_at);
      const fiveMinutesInMs = 5 * 60 * 1000;

      let accessToken = tokenData.access_token;

      if (tokenExpiresAt - now < fiveMinutesInMs) {
        const refreshedToken = await tokenService.refreshTokenByEmail(email);
        accessToken = refreshedToken.access_token;
      }

      const apiUrl = `https://api.atlassian.com/ex/jira/${tokenData.cloud_id}/rest/api/3/issue/${issueKey}/remotelink`;

      const requestBody = {
        application: {
          name: application.name,
          type: application.type,
        },
        object: {
          url: object.url,
          title: object.title,
          summary: object.summary,
          icon: object.icon,
        },
      };

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating remote link:", error.message);
      throw error;
    }
  },

  deleteRemoteLink: async (email, issueKey, remoteLinkId) => {
    try {
      const tokenData = await tokenService.getTokenByEmail(email);

      if (!tokenData) {
        throw new Error("No token found for the provided email");
      }

      const now = Date.now();
      const tokenExpiresAt = parseInt(tokenData.token_expires_at);
      const fiveMinutesInMs = 5 * 60 * 1000;

      let accessToken = tokenData.access_token;

      if (tokenExpiresAt - now < fiveMinutesInMs) {
        const refreshedToken = await tokenService.refreshTokenByEmail(email);
        accessToken = refreshedToken.access_token;
      }

      const apiUrl = `https://api.atlassian.com/ex/jira/${tokenData.cloud_id}/rest/api/3/issue/${issueKey}/remotelink/${remoteLinkId}`;

      await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      return true;
    } catch (error) {
      console.error("Error deleting remote link:", error.message);
      throw error;
    }
  },

  getAssignedTasks: async (email, options = {}) => {
    try {
      const tokenData = await tokenService.getTokenByEmail(email);

      if (!tokenData) {
        throw new Error("No token found for the provided email");
      }

      const now = Date.now();
      const tokenExpiresAt = parseInt(tokenData.token_expires_at);
      const fiveMinutesInMs = 5 * 60 * 1000;

      let accessToken = tokenData.access_token;

      if (tokenExpiresAt - now < fiveMinutesInMs) {
        const refreshedToken = await tokenService.refreshTokenByEmail(email);
        accessToken = refreshedToken.access_token;
      }

      let jql = "assignee = currentUser()";

      if (options.status) {
        jql += ` AND status = "${options.status}"`;
      }

      if (options.excludeStatuses && options.excludeStatuses.length > 0) {
        const excludeConditions = options.excludeStatuses.map(
          (status) => `status != "${status}"`
        );
        jql += ` AND (${excludeConditions.join(" AND ")})`;
      }

      if (options.project) {
        jql += ` AND project = "${options.project}"`;
      }

      jql += " ORDER BY created DESC";

      const queryParams = new URLSearchParams({
        jql: jql,
        fields: "key,summary",
        maxResults: options.maxResults || 50,
        startAt: options.startAt || 0,
      });

      const apiUrl = `https://api.atlassian.com/ex/jira/${tokenData.cloud_id}/rest/api/3/search?${queryParams}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const transformedIssues = (response.data.issues || []).map((issue) => ({
        issueKey: issue.key,
        title: issue.fields.summary,
      }));

      return {
        issues: transformedIssues,
        total: response.data.total || 0,
        startAt: response.data.startAt || 0,
        maxResults: response.data.maxResults || 50,
      };
    } catch (error) {
      console.error("Error getting assigned tasks:", error.message);
      throw error;
    }
  },
};

module.exports = jiraService;
