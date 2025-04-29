import { relations } from "drizzle-orm";
import { ProjectTable, TestSuiteTable } from "./schema";

export const ProjectTableRelations = relations(ProjectTable, ({ many }) => ({
  listTestSuite: many(TestSuiteTable),
}));

export const TestSuiteTableRelations = relations(TestSuiteTable, ({ one }) => ({
  project: one(ProjectTable, {
    fields: [TestSuiteTable.projectId],
    references: [ProjectTable.id],
  }),
}));
