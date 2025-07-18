import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  bigint,
  serial,
} from 'drizzle-orm/pg-core';

export const enumCollectionSharesPermission = pgEnum('enum_collection_shares_permission', [
  'view',
  'edit',
]);
export const enumCollectionSharesStatus = pgEnum('enum_collection_shares_status', [
  'pending',
  'accepted',
]);
const commonTable = {
  id: varchar({ length: 255 }).primaryKey().unique().notNull(),
  params: jsonb(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdBy: varchar('created_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  updatedBy: varchar('updated_by', { length: 255 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  deletedBy: varchar('deleted_by', { length: 255 }),
};

export const TestResourceTable = pgTable('tbl_test_resource', {
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  content: text().notNull(),
  fileName: varchar('file_name', { length: 255 }),
  ...commonTable,
});
export const ProjectTable = pgTable('tbl_projects', {
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  slug: varchar().notNull(),
  ...commonTable,
});

export const ProjectAssignmentTable = pgTable('tbl_project_assignments', {
  projectId: varchar('project_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  ...commonTable,
});

export const enumTestSuiteExecuteStatus = pgEnum('enum_testsuite_execute_status', [
  'pending',
  'processing',
  'success',
  'failed',
]);
export const TestSuiteExecuteTable = pgTable('tbl_testsuite_execute', {
  testSuiteId: varchar('testsuite_id', { length: 255 }),
  projectId: varchar('project_id', { length: 255 }),
  status: enumTestSuiteExecuteStatus(),
  ...commonTable,
});
export const enumTestSuiteStatus = pgEnum('test_suite_status', [
  'Not Run',
  'Running',
  'Completed',
  'Failed',
  'Aborted',
]);
export const TestSuiteTable = pgTable('tbl_test_suites', {
  projectId: varchar('project_id', { length: 255 }).notNull(),
  name: varchar().notNull(),
  description: text(),
  content: text().notNull(),
  totalTests: integer('total_tests'),
  passedTests: integer('passed_tests'),
  failedTests: integer('failed_tests'),
  lastRunDate: timestamp('last_run_date', { withTimezone: true, mode: 'string' }),
  status: enumTestSuiteStatus(),
  progress: integer(),
  tags: text().array(),
  fileName: varchar('file_name', { length: 255 }),
  ...commonTable,
});

export const CommentTable = pgTable('tbl_comments', {
  projectId: varchar('project_id', { length: 255 }).notNull(),
  testSuiteId: varchar('testsuite_id', { length: 255 }),
  resourceId: varchar('resource_id', { length: 255 }),
  email: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  ...commonTable,
});

export const ActivityLogTable = pgTable('tbl_activity_logs', {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  projectId: varchar('project_id', { length: 255 })
    .notNull()
    .references(() => ProjectTable.id),
  targetId: varchar('target_id', { length: 255 }),
  targetType: varchar('target_type', { length: 50 }),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  description: text().notNull(),
  metadata: jsonb(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdBy: varchar('created_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  updatedBy: varchar('updated_by', { length: 255 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  deletedBy: varchar('deleted_by', { length: 255 }),
});

export const OAuthTokensTable = pgTable('oauth_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userName: varchar('user_name', { length: 255 }),
  userEmail: varchar('user_email', { length: 255 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: bigint('token_expires_at', { mode: 'number' }).notNull(),
  cloudId: varchar('cloud_id', { length: 255 }),
  cloudName: varchar('cloud_name', { length: 255 }),
  cloudUrl: varchar('cloud_url', { length: 255 }),
  scopes: text('scopes').array(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
});

export const RemoteLinkLocksTable = pgTable('remote_link_locks', {
  id: serial('id').primaryKey(),
  issueKey: varchar('issue_key', { length: 255 }).notNull(),
  testSuiteId: varchar('test_suite_id', { length: 255 }).notNull(),
  applicationType: varchar('application_type', { length: 255 }),
  applicationName: varchar('application_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
});

export const enumManualTestCaseStatus = pgEnum('manual_test_case_status', [
  'Not Started',
  'In Progress',
  'Passed',
  'Failed',
  'Draft',
]);

export const enumManualTestCasePriority = pgEnum('manual_test_case_priority', [
  'Low',
  'Medium',
  'High',
]);

export const enumManualTestCaseCategory = pgEnum('manual_test_case_category', [
  'functional',
  'ui',
  'integration',
  'api',
  'performance',
  'security',
]);

export const enumBugStatusType = pgEnum('bug_status_type', [
  'none',
  'bug',
  'fixed',
  'testing',
  'pending',
]);

export const ManualTestCaseTable = pgTable('tbl_manual_test_cases', {
  name: varchar({ length: 255 }).notNull(),
  category: enumManualTestCaseCategory().notNull(),
  priority: enumManualTestCasePriority().default('Medium'),
  estimatedTime: integer('estimated_time'),
  description: text().notNull(),
  assignedTo: varchar('assigned_to', { length: 255 }),
  assignedToEmail: varchar('assigned_to_email', { length: 255 }),
  dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }),
  status: enumManualTestCaseStatus().default('Not Started'),
  bugStatusType: enumBugStatusType('bug_status_type').default('none'),
  bugReporter: varchar('bug_reporter', { length: 255 }),
  bugMessage: varchar('bug_message', { length: 255 }),
  tags: text().array(),
  notes: text(),
  executionHistory: jsonb('execution_history').default([]),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  ...commonTable,
});

export const enumBugSeverity = pgEnum('bug_severity', ['Critical', 'High', 'Medium', 'Low']);
export const enumBugPriority = pgEnum('bug_priority', ['High', 'Medium', 'Low']);
export const enumBugStatus = pgEnum('bug_status', [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
  'Reopened',
]);

export const BugTable = pgTable('tbl_bugs', {
  manualTestCaseId: varchar('manual_test_case_id', { length: 255 })
    .notNull()
    .references(() => ManualTestCaseTable.id),
  projectId: varchar('project_id', { length: 255 })
    .notNull()
    .references(() => ProjectTable.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text(),
  severity: enumBugSeverity('severity').default('Medium').notNull(),
  priority: enumBugPriority('priority').default('Medium').notNull(),
  status: enumBugStatus('status').default('Open').notNull(),
  assignedToEmail: varchar('assigned_to_email', { length: 255 }),
  reporterEmail: varchar('reporter_email', { length: 255 }).notNull(),
  ...commonTable,
});
