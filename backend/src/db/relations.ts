import { relations } from "drizzle-orm";
import { ProjectTable, TestSuiteTable, TestResourceTable } from "./schema";

export const ProjectTableRelations = relations(ProjectTable, ({ many }) => ({
  listTestSuite: many(TestSuiteTable),
  listTestResource: many(TestResourceTable),
}));

export const TestSuiteTableRelations = relations(TestSuiteTable, ({ one }) => ({
  project: one(ProjectTable, {
    fields: [TestSuiteTable.projectId],
    references: [ProjectTable.id],
  }),
}));

export const TestResourceTableRelations = relations(
  TestResourceTable,
  ({ one }) => ({
    project: one(ProjectTable, {
      fields: [TestResourceTable.projectId],
      references: [ProjectTable.id],
    }),
  })
);
