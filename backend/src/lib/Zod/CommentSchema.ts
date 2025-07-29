import { z } from 'zod';

export const schemaForCreateComment = z.object({
  projectId: z.string().ulid(),
  testSuiteId: z.string().ulid().optional().nullable(),
  resourceId: z.string().ulid().optional().nullable(),
  message: z.string().min(1),
});

export const schemaForUpdateComment = z.object({
  message: z.string().min(1),
});

export const schemaForGetComments = z.object({
  projectId: z.string().ulid().optional(),
  testSuiteId: z.string().ulid().optional(),
  resourceId: z.string().ulid().optional(),
});
