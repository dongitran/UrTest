import { z } from 'zod';

export const schemaForCreateTestCase = z.object({
  projectId: z.string().ulid(),
  name: z.string().min(1),
  category: z.enum(['functional', 'ui', 'integration', 'api', 'performance', 'security']),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  description: z.string().min(1),
  assignedTo: z.string().email().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Not Started', 'In Progress', 'Passed', 'Failed', 'Draft']).optional(),
});

export const schemaForUpdateTestCase = z.object({
  name: z.string().min(1).optional(),
  category: z
    .enum(['functional', 'ui', 'integration', 'api', 'performance', 'security'])
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  description: z.string().min(1).optional(),
  assignedTo: z.string().email().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const schemaForUpdateStatus = z.object({
  status: z.enum(['Not Started', 'In Progress', 'Passed', 'Failed', 'Draft']),
  notes: z.string().optional(),
  bugStatus: z
    .object({
      type: z.enum(['none', 'bug', 'fixed', 'testing', 'pending']),
      reporter: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

export const schemaForExecuteTestCase = z.object({
  status: z.enum(['Passed', 'Failed']),
  notes: z.string().optional(),
  executionTime: z.number().optional(),
});

export const schemaForGetTestCases = z.object({
  projectId: z.string().ulid(),
  status: z.enum(['all', 'not-started', 'in-progress', 'passed', 'failed', 'draft']).optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

export const schemaForIdParam = z.object({
  id: z.string().ulid(),
});
