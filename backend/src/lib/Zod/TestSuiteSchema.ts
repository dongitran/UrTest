import { z } from 'zod';

export const shemaForCreateAndPatch = z.object({
  projectId: z.string().ulid(),
  name: z.string(),
  description: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  resultRunner: z
    .object({
      reportUrl: z.string().optional(),
      project: z.string().optional(),
      requestId: z.string().ulid().optional(),
      success: z.boolean().optional(),
      error: z.boolean().optional(),
      message: z.string().optional(),
    })
    .optional(),
  duration: z.number().optional(),
});
export const schemaForIdParamOnly = z.object({
  id: z.string().ulid(),
});
