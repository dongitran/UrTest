import { relations } from "drizzle-orm";
import {
  ProjectTable,
  TestSuiteTable,
  TestResourceTable,
  ProjectAssignmentTable,
} from "./schema";

export const ProjectTableRelations = relations(ProjectTable, ({ many }) => ({
  listTestSuite: many(TestSuiteTable),
  listTestResource: many(TestResourceTable),
  assignments: many(ProjectAssignmentTable),
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

export const ProjectAssignmentTableRelations = relations(
  ProjectAssignmentTable,
  ({ one }) => ({
    project: one(ProjectTable, {
      fields: [ProjectAssignmentTable.projectId],
      references: [ProjectTable.id],
    }),
  })
);
