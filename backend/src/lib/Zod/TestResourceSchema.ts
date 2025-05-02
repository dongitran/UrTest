import { z } from "zod";

export const schemaForCreateAndPatch = z.object({
  testResourceId: z.string().ulid().optional(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  projectId: z.string().ulid(),
});
