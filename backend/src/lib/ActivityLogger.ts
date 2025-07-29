import db from '../db/db';
import { ActivityLogTable } from '../db/schema';
import dayjs from 'dayjs';
import { ulid } from 'ulid';

export type ActivityType =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_STAFF_ADDED'
  | 'PROJECT_STAFF_REMOVED'
  | 'TEST_SUITE_CREATED'
  | 'TEST_SUITE_UPDATED'
  | 'TEST_SUITE_DELETED'
  | 'TEST_SUITE_EXECUTION_STARTED'
  | 'TEST_SUITE_EXECUTION_COMPLETED'
  | 'TEST_SUITE_EXECUTION_FAILED'
  | 'TEST_RESOURCE_CREATED'
  | 'TEST_RESOURCE_UPDATED'
  | 'TEST_RESOURCE_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'MANUAL_TEST_CASE_CREATED'
  | 'MANUAL_TEST_CASE_UPDATED'
  | 'MANUAL_TEST_CASE_DELETED'
  | 'MANUAL_TEST_CASE_EXECUTED'
  | 'BUG_CREATED'
  | 'BUG_UPDATED'
  | 'BUG_DELETED';

export type TargetType =
  | 'project'
  | 'test_suite'
  | 'test_resource'
  | 'comment'
  | 'manual_test_case'
  | 'bug'
  | null;

export type ActivityMetadata = Record<string, any>;

export const logActivity = async (
  activityType: ActivityType,
  projectId: string,
  userEmail: string,
  description: string,
  targetId: string | null = null,
  targetType: TargetType = null,
  metadata: ActivityMetadata = {}
): Promise<void> => {
  try {
    await db.insert(ActivityLogTable).values({
      id: ulid(),
      activityType,
      projectId,
      targetId,
      targetType,
      userEmail,
      description,
      metadata,
      createdAt: dayjs().toISOString(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const ACTIVITY_TYPES: Record<string, ActivityType> = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_STAFF_ADDED: 'PROJECT_STAFF_ADDED',
  PROJECT_STAFF_REMOVED: 'PROJECT_STAFF_REMOVED',

  TEST_SUITE_CREATED: 'TEST_SUITE_CREATED',
  TEST_SUITE_UPDATED: 'TEST_SUITE_UPDATED',
  TEST_SUITE_DELETED: 'TEST_SUITE_DELETED',
  TEST_SUITE_EXECUTION_STARTED: 'TEST_SUITE_EXECUTION_STARTED',
  TEST_SUITE_EXECUTION_COMPLETED: 'TEST_SUITE_EXECUTION_COMPLETED',
  TEST_SUITE_EXECUTION_FAILED: 'TEST_SUITE_EXECUTION_FAILED',

  TEST_RESOURCE_CREATED: 'TEST_RESOURCE_CREATED',
  TEST_RESOURCE_UPDATED: 'TEST_RESOURCE_UPDATED',
  TEST_RESOURCE_DELETED: 'TEST_RESOURCE_DELETED',

  COMMENT_ADDED: 'COMMENT_ADDED',
  COMMENT_DELETED: 'COMMENT_DELETED',

  MANUAL_TEST_CASE_CREATED: 'MANUAL_TEST_CASE_CREATED',
  MANUAL_TEST_CASE_UPDATED: 'MANUAL_TEST_CASE_UPDATED',
  MANUAL_TEST_CASE_DELETED: 'MANUAL_TEST_CASE_DELETED',
  MANUAL_TEST_CASE_EXECUTED: 'MANUAL_TEST_CASE_EXECUTED',

  BUG_CREATED: 'BUG_CREATED',
  BUG_UPDATED: 'BUG_UPDATED',
  BUG_DELETED: 'BUG_DELETED',
};
