import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import jiraService from '../services/jiraService';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';

const JiraRoute = new Hono();

const GetAssignedTasksSchema = z.object({
  status: z.string().optional(),
  project: z.string().optional(),
  excludeStatuses: z.string().optional(),
  maxResults: z.string().optional(),
  startAt: z.string().optional(),
});

JiraRoute.get(
  '/my-assigned-tasks',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('query', GetAssignedTasksSchema),
  async (ctx) => {
    try {
      const user = ctx.get('user');
      const query = ctx.req.valid('query');

      let excludeStatusesArray: string[] = [];
      if (query.excludeStatuses) {
        excludeStatusesArray = query.excludeStatuses
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }

      const options = {
        status: query.status,
        project: query.project,
        excludeStatuses: excludeStatusesArray,
        maxResults: query.maxResults ? parseInt(query.maxResults) : 50,
        startAt: query.startAt ? parseInt(query.startAt) : 0,
      };

      const result = await jiraService.getAssignedTasks(user.email, options);

      return ctx.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error getting assigned tasks:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('No token found') || errorMessage.includes('authentication')) {
        return ctx.json(
          {
            success: false,
            message: 'No valid Jira token found. Please link your Jira account first.',
            error: errorMessage,
          },
          401
        );
      }

      return ctx.json(
        {
          success: false,
          message: 'Failed to fetch assigned tasks from Jira',
          error: errorMessage,
        },
        500
      );
    }
  }
);

export default JiraRoute;
