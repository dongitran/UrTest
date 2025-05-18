import { relations } from 'drizzle-orm';
import {
  ProjectTable,
  TestSuiteTable,
  TestResourceTable,
  ProjectAssignmentTable,
  CommentTable,
  ActivityLogTable,
  RemoteLinkLocksTable,
} from './schema';

export const ProjectTableRelations = relations(ProjectTable, ({ many }) => ({
  listTestSuite: many(TestSuiteTable),
  listTestResource: many(TestResourceTable),
  assignments: many(ProjectAssignmentTable),
  comments: many(CommentTable),
  activities: many(ActivityLogTable),
}));

export const TestSuiteTableRelations = relations(TestSuiteTable, ({ one, many }) => ({
  project: one(ProjectTable, {
    fields: [TestSuiteTable.projectId],
    references: [ProjectTable.id],
  }),
  comments: many(CommentTable),
  remoteLinks: many(RemoteLinkLocksTable),
}));

export const TestResourceTableRelations = relations(TestResourceTable, ({ one, many }) => ({
  project: one(ProjectTable, {
    fields: [TestResourceTable.projectId],
    references: [ProjectTable.id],
  }),
  comments: many(CommentTable),
}));

export const ProjectAssignmentTableRelations = relations(ProjectAssignmentTable, ({ one }) => ({
  project: one(ProjectTable, {
    fields: [ProjectAssignmentTable.projectId],
    references: [ProjectTable.id],
  }),
}));

export const CommentTableRelations = relations(CommentTable, ({ one }) => ({
  project: one(ProjectTable, {
    fields: [CommentTable.projectId],
    references: [ProjectTable.id],
  }),
  testSuite: one(TestSuiteTable, {
    fields: [CommentTable.testSuiteId],
    references: [TestSuiteTable.id],
  }),
  resource: one(TestResourceTable, {
    fields: [CommentTable.resourceId],
    references: [TestResourceTable.id],
  }),
}));

export const ActivityLogTableRelations = relations(ActivityLogTable, ({ one }) => ({
  project: one(ProjectTable, {
    fields: [ActivityLogTable.projectId],
    references: [ProjectTable.id],
  }),
}));

export const RemoteLinkLocksTableRelations = relations(RemoteLinkLocksTable, ({ one }) => ({
  testSuite: one(TestSuiteTable, {
    fields: [RemoteLinkLocksTable.testSuiteId],
    references: [TestSuiteTable.id],
  }),
}));
