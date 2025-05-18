import ErrorLog from '@middlewars/ErrorLog';
import { customLogger } from '@middlewars/index';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import MongoConfig from './config/mongodb';
import ProjectRoute from '@route/project.route';
import VerifyToken from '@middlewars/VerifyToken';
import CheckPermission from '@middlewars/CheckPermission';
import DashboardRoute from '@route/dashboard.route';
import TestSuiteRoute from '@route/testsuite.route';
import TestResourceRoute from '@route/testResource.route';
import AIChatRoute from '@route/ai-chat.route';
import CommentRoute from '@route/comment.route';
import ActivityRoute from '@route/activity.route';
import JiraOAuthRoute from '@route/jiraOauth.route';
import JiraRoute from '@route/jira.route';
import JiraLinkRoute from '@route/jiraLink.route';

const app = new Hono();

// MongoConfig.connectToMongoDB();

app.use(cors());
app.use(logger(customLogger));
app.use('/api/*', VerifyToken());

app.route('/api/dashboard', DashboardRoute);
app.route('/api/project', ProjectRoute);
app.route('/api/testsuite', TestSuiteRoute);
app.route('/api/test-resource', TestResourceRoute);
app.route('/api/ai', AIChatRoute);
app.route('/api/comment', CommentRoute);
app.route('/api/activities', ActivityRoute);
app.route('/api/jira-oauth', JiraOAuthRoute);
app.route('/api/jira', JiraRoute);
app.route('/api/jira-link', JiraLinkRoute);

app.onError(ErrorLog);

export default app;
