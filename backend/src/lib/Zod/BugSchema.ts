import { z } from 'zod';

export const schemaForCreateBug = z.object({
  manualTestCaseId: z.string().ulid(),
  projectId: z.string().ulid(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium').optional(),
  assignedToEmail: z.string().email().optional().nullable(),
});

export const schemaForBugIdParam = z.object({
  id: z.string().ulid(),
});

export const schemaForTestCaseIdParam = z.object({
  testCaseId: z.string().ulid(),
});
