import { z } from 'zod';

export const schemaForCreateRemoteLink = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
  testSuiteId: z.string().ulid('Invalid test suite ID'),
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

export const schemaForRemoveRemoteLink = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
  testSuiteId: z.string().ulid('Invalid test suite ID'),
});

export const schemaForGetRemoteLinks = z.object({
  testSuiteId: z.string().ulid('Invalid test suite ID').optional(),
  issueKey: z.string().min(1, 'Issue key is required').optional(),
});

export const schemaForJiraIssueKey = z.object({
  issueKey: z.string().regex(/^[A-Z]+-\d+$/, 'Invalid Jira issue key format'),
});
