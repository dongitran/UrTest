import { Hono } from 'hono';
import db from 'db/db';
import VerifyToken from '@middlewars/VerifyToken';

const JiraOAuthRoute = new Hono();

JiraOAuthRoute.use('/*', VerifyToken());

JiraOAuthRoute.get('/check-jira-connection', async (ctx) => {
  const user = ctx.get('user');
  const email = user.email;

  const oauthToken = await db.query.OAuthTokensTable.findFirst({
    where: (clm, { eq }) => eq(clm.userEmail, email),
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

export default JiraOAuthRoute;
