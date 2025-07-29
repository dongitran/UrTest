import { Hono } from 'hono';
import db from 'db/db';
import VerifyToken from '@middlewars/VerifyToken';
import jiraService from '../services/jiraService';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';

const JiraOAuthRoute = new Hono();

JiraOAuthRoute.use('/*', VerifyToken());

JiraOAuthRoute.get('/check-jira-connection', async (ctx) => {
  const user = ctx.get('user');
  const email = user.email;

  const oauthToken = await db.query.OAuthTokensTable.findFirst({
    where: (clm, { eq, isNull, and }) => and(eq(clm.userEmail, email), isNull(clm.deletedAt)),
  });

  return ctx.json({
    connected: !!oauthToken,
    connectionData: oauthToken
      ? {
          userId: oauthToken.userId,
          cloudId: oauthToken.cloudId,
          cloudName: oauthToken.cloudName,
          cloudUrl: oauthToken.cloudUrl,
          scopes: oauthToken.scopes,
          connectedAt: oauthToken.createdAt,
        }
      : null,
  });
});

JiraOAuthRoute.delete(
  '/unlink-jira-connection',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const email = user.email;

      const isConnected = await jiraService.checkJiraConnection(email);
      if (!isConnected) {
        return ctx.json(
          {
            success: false,
            message: 'No JIRA connection found to unlink',
          },
          404
        );
      }

      await jiraService.unlinkJiraConnection(email);

      return ctx.json({
        success: true,
        message: 'JIRA account has been successfully unlinked',
        data: {
          email: email,
          unlinkedAt: new Date().toISOString(),
          note: 'Your existing test suite links to JIRA issues have been preserved and are still active on JIRA',
        },
      });
    } catch (error) {
      console.error('Error unlinking JIRA connection:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return ctx.json(
        {
          success: false,
          message: 'Failed to unlink JIRA connection',
          error: errorMessage,
        },
        500
      );
    }
  }
);

JiraOAuthRoute.get(
  '/connection-details',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const email = user.email;

      const oauthToken = await db.query.OAuthTokensTable.findFirst({
        where: (clm, { eq, isNull, and }) => and(eq(clm.userEmail, email), isNull(clm.deletedAt)),
      });

      if (!oauthToken) {
        return ctx.json({
          connected: false,
          connectionData: null,
        });
      }

      return ctx.json({
        connected: true,
        connectionData: {
          userId: oauthToken.userId,
          userName: oauthToken.userName,
          userEmail: oauthToken.userEmail,
          cloudId: oauthToken.cloudId,
          cloudName: oauthToken.cloudName,
          cloudUrl: oauthToken.cloudUrl,
          scopes: oauthToken.scopes,
          connectedAt: oauthToken.createdAt,
          lastUpdated: oauthToken.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error getting connection details:', error);

      return ctx.json(
        {
          success: false,
          message: 'Failed to get connection details',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

JiraOAuthRoute.get(
  '/my-remote-links',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const email = user.email;

      const links = await db.query.RemoteLinkLocksTable.findMany({
        where: (clm, { eq, isNull, and }) => and(eq(clm.email, email), isNull(clm.deletedAt)),
        orderBy: (clm, { desc }) => desc(clm.createdAt),
      });

      const isConnected = await jiraService.checkJiraConnection(email);

      return ctx.json({
        success: true,
        data: {
          links,
          totalCount: links.length,
          isJiraConnected: isConnected,
          note:
            !isConnected && links.length > 0
              ? 'These links were created when you had JIRA connected. They are still active on JIRA but you cannot manage them without reconnecting.'
              : null,
        },
      });
    } catch (error) {
      console.error('Error getting remote links:', error);

      return ctx.json(
        {
          success: false,
          message: 'Failed to get remote links',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default JiraOAuthRoute;
