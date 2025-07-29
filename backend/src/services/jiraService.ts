import axios from 'axios';
import db from '../db/db';
import { OAuthTokensTable } from '../db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import dayjs from 'dayjs';

export interface JiraTask {
  issueKey: string;
  title: string;
}

export interface JiraAssignedTasksResponse {
  issues: JiraTask[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface GetAssignedTasksOptions {
  status?: string;
  project?: string;
  excludeStatuses?: string[];
  maxResults?: number;
  startAt?: number;
}

export interface JiraRemoteLink {
  id: number;
  self: string;
  object: {
    url: string;
    title: string;
    summary?: string;
    icon?: {
      url16x16?: string;
      title?: string;
    };
  };
  application: {
    name: string;
    type: string;
  };
}

class JiraService {
  async getTokenByEmail(email: string) {
    try {
      const tokenData = await db.query.OAuthTokensTable.findFirst({
        where: and(eq(OAuthTokensTable.userEmail, email), isNull(OAuthTokensTable.deletedAt)),
      });
      return tokenData;
    } catch (error) {
      console.error('Error getting token by email:', error);
      throw error;
    }
  }

  async refreshToken(email: string) {
    try {
      const tokenData = await this.getTokenByEmail(email);

      if (!tokenData || !tokenData.refreshToken) {
        throw new Error('No token found or refresh token missing');
      }

      const response = await axios.post('https://auth.atlassian.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.BACKEND_ATLASSIAN_CLIENT_ID,
        client_secret: process.env.BACKEND_ATLASSIAN_CLIENT_SECRET,
        refresh_token: tokenData.refreshToken,
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const token_expires_at = Date.now() + expires_in * 1000;

      await db
        .update(OAuthTokensTable)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token || tokenData.refreshToken,
          tokenExpiresAt: token_expires_at,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(OAuthTokensTable.userEmail, email));

      return {
        access_token,
        refresh_token: refresh_token || tokenData.refreshToken,
        token_expires_at,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async getValidToken(email: string) {
    const tokenData = await this.getTokenByEmail(email);

    if (!tokenData) {
      throw new Error('No token found for the provided email');
    }

    const now = Date.now();
    const tokenExpiresAt = tokenData.tokenExpiresAt;
    const fiveMinutesInMs = 5 * 60 * 1000;

    let accessToken = tokenData.accessToken;

    if (tokenExpiresAt - now < fiveMinutesInMs) {
      const refreshedToken = await this.refreshToken(email);
      accessToken = refreshedToken.access_token;
    }

    return {
      accessToken,
      cloudId: tokenData.cloudId,
    };
  }

  async unlinkJiraConnection(email: string): Promise<void> {
    try {
      await db
        .update(OAuthTokensTable)
        .set({
          accessToken: null,
          refreshToken: null,
          deletedAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
        })
        .where(and(eq(OAuthTokensTable.userEmail, email), isNull(OAuthTokensTable.deletedAt)));

      console.log(`Successfully unlinked JIRA account for user: ${email}`);
    } catch (error) {
      console.error('Error unlinking JIRA connection:', error);
      throw error;
    }
  }

  async getRemoteLinks(email: string, issueKey: string): Promise<JiraRemoteLink[]> {
    try {
      const { accessToken, cloudId } = await this.getValidToken(email);

      const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/remotelink`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      return response.data || [];
    } catch (error) {
      console.error('Error getting remote links:', error);
      throw error;
    }
  }

  async createRemoteLink(
    email: string,
    issueKey: string,
    object: {
      url: string;
      title: string;
      summary?: string;
      icon?: {
        url16x16?: string;
        title?: string;
      };
    },
    application: {
      name: string;
      type: string;
    }
  ) {
    try {
      const { accessToken, cloudId } = await this.getValidToken(email);

      const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/remotelink`;

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
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating remote link:', error);
      throw error;
    }
  }

  async deleteRemoteLink(email: string, issueKey: string, remoteLinkId: number) {
    try {
      const { accessToken, cloudId } = await this.getValidToken(email);

      const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/remotelink/${remoteLinkId}`;

      await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      return true;
    } catch (error) {
      console.error('Error deleting remote link:', error);
      throw error;
    }
  }

  async getAssignedTasks(
    email: string,
    options: GetAssignedTasksOptions = {}
  ): Promise<JiraAssignedTasksResponse> {
    try {
      const { accessToken, cloudId } = await this.getValidToken(email);

      let jql = 'assignee = currentUser()';

      if (options.status) {
        jql += ` AND status = "${options.status}"`;
      }

      if (options.excludeStatuses && options.excludeStatuses.length > 0) {
        const excludeConditions = options.excludeStatuses.map((status) => `status != "${status}"`);
        jql += ` AND (${excludeConditions.join(' AND ')})`;
      }

      if (options.project) {
        jql += ` AND project = "${options.project}"`;
      }

      jql += ' ORDER BY created DESC';

      const queryParams = new URLSearchParams({
        jql: jql,
        fields: 'key,summary',
        maxResults: (options.maxResults || 50).toString(),
        startAt: (options.startAt || 0).toString(),
      });

      const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?${queryParams}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      const transformedIssues: JiraTask[] = (response.data.issues || []).map((issue: any) => ({
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
      console.error('Error getting assigned tasks:', error);
      throw error;
    }
  }

  async checkJiraConnection(email: string): Promise<boolean> {
    try {
      const tokenData = await this.getTokenByEmail(email);
      return !!tokenData && !!tokenData.accessToken;
    } catch (error) {
      console.error('Error checking Jira connection:', error);
      return false;
    }
  }
}

export default new JiraService();
