import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import jiraService from '../services/jiraService';
import linkService from '../services/linkService';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';

const JiraLinkRoute = new Hono();

const RegisterRemoteLinkSchema = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
  testSuiteId: z.string().min(1, 'Test suite ID is required'),
  object: z.object({
    url: z.string().url('Valid URL is required'),
    title: z.string().min(1, 'Title is required'),
    summary: z.string().optional(),
    icon: z
      .object({
        url16x16: z.string().url().optional(),
        title: z.string().optional(),
      })
      .optional(),
  }),
  application: z.object({
    name: z.string().min(1, 'Application name is required'),
    type: z.string().min(1, 'Application type is required'),
  }),
});

const RemoveRemoteLinkSchema = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
  testSuiteId: z.string().min(1, 'Test suite ID is required'),
});

const GetLinksByTestSuiteSchema = z.object({
  testSuiteId: z.string().min(1, 'Test suite ID is required'),
});

const GetLinksByIssueSchema = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
});

JiraLinkRoute.post(
  '/link-testsuite-to-issue',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('json', RegisterRemoteLinkSchema),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const body = ctx.req.valid('json');
      const email = user.email;

      const isConnected = await jiraService.checkJiraConnection(email);
      if (!isConnected) {
        return ctx.json(
          {
            status: 'error',
            message: 'No valid Jira token found. Please link your Jira account first.',
          },
          401
        );
      }

      const linkResult = await linkService.checkAndCreateLink(
        body.issueKey,
        body.testSuiteId,
        body.application.type,
        body.application.name,
        email
      );

      if (!linkResult.isNew && !linkResult.wasRelinked) {
        const existingLinks = await jiraService.getRemoteLinks(email, body.issueKey);
        const duplicateLink = existingLinks.find(
          (link) => link.object && link.object.url === body.object.url
        );

        if (duplicateLink) {
          return ctx.json({
            status: 'success',
            message: 'Remote link already exists for this test suite on this issue',
            data: duplicateLink,
          });
        }
      }

      const result = await jiraService.createRemoteLink(
        email,
        body.issueKey,
        body.object,
        body.application
      );

      let message = 'Remote link has been created successfully';
      if (linkResult.wasRelinked) {
        message = `Test suite has been successfully relinked from previous issue to ${body.issueKey}`;
      } else if (!linkResult.isNew) {
        message = 'Remote link has been updated successfully';
      }

      return ctx.json({
        status: 'success',
        message,
        data: {
          ...result,
          wasRelinked: linkResult.wasRelinked,
          isNew: linkResult.isNew,
        },
      });
    } catch (error) {
      console.error('Error linking test suite to issue:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        return ctx.json(
          {
            status: 'error',
            message:
              'This test suite is already linked. Please try again or contact support if the issue persists.',
            error: 'Constraint violation - possible race condition',
          },
          409
        );
      }

      if (errorMessage.includes('No token found') || errorMessage.includes('authentication')) {
        return ctx.json(
          {
            status: 'error',
            message: 'No valid Jira token found. Please link your Jira account first.',
            error: errorMessage,
          },
          401
        );
      }

      return ctx.json(
        {
          status: 'error',
          message: 'Failed to link test suite to Jira issue',
          error: errorMessage,
        },
        500
      );
    }
  }
);

JiraLinkRoute.delete(
  '/unlink-testsuite-from-issue',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('json', RemoveRemoteLinkSchema),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const body = ctx.req.valid('json');
      const email = user.email;

      const isConnected = await jiraService.checkJiraConnection(email);
      if (!isConnected) {
        return ctx.json(
          {
            status: 'error',
            message: 'No valid Jira token found. Please link your Jira account first.',
          },
          401
        );
      }

      await linkService.deleteLink(body.issueKey, body.testSuiteId, email);

      return ctx.json({
        status: 'success',
        message: 'Remote link has been deleted successfully',
      });
    } catch (error) {
      console.error('Error unlinking test suite from issue:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return ctx.json(
        {
          status: 'error',
          message: 'Failed to unlink test suite from Jira issue',
          error: errorMessage,
        },
        500
      );
    }
  }
);

JiraLinkRoute.get(
  '/links-by-testsuite/:testSuiteId',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('param', GetLinksByTestSuiteSchema),
  async (ctx) => {
    try {
      const { testSuiteId } = ctx.req.valid('param');

      const links = await linkService.getLinksByTestSuite(testSuiteId);

      return ctx.json({
        status: 'success',
        data: links,
      });
    } catch (error) {
      console.error('Error getting links by test suite:', error);

      return ctx.json(
        {
          status: 'error',
          message: 'Failed to fetch links',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

JiraLinkRoute.get(
  '/links-by-issue/:issueKey',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('param', GetLinksByIssueSchema),
  async (ctx) => {
    try {
      const { issueKey } = ctx.req.valid('param');

      const links = await linkService.getLinksByIssue(issueKey);

      return ctx.json({
        status: 'success',
        data: links,
      });
    } catch (error) {
      console.error('Error getting links by issue:', error);

      return ctx.json(
        {
          status: 'error',
          message: 'Failed to fetch links',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default JiraLinkRoute;
