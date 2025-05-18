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
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: bigint('token_expires_at', { mode: 'number' }).notNull(),
  cloudId: varchar('cloud_id', { length: 255 }),
  cloudName: varchar('cloud_name', { length: 255 }),
  cloudUrl: varchar('cloud_url', { length: 255 }),
  scopes: text('scopes').array(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
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
