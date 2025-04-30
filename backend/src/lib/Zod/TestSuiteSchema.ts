import { z } from "zod";

export const shemaForCreateAndPatch = z.object({
  projectId: z.string().ulid(),
  name: z.string(),
  description: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  resultRuner: z
    .object({
      reportUrl: z.string(),
      project: z.string(),
      requestId: z.string().ulid(),
      success: z.boolean(),
    })
    .optional(),
  duration: z.number().optional(),
});
export const schemaForIdParamOnly = z.object({
  id: z.string().ulid(),
});
