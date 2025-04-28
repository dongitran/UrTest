import { jsonb, pgEnum, pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const enumCollectionSharesPermission = pgEnum("enum_collection_shares_permission", ["view", "edit"]);
export const enumCollectionSharesStatus = pgEnum("enum_collection_shares_status", ["pending", "accepted"]);
const commonTable = {
  id: varchar({ length: 255 }).primaryKey().unique().notNull(),
  params: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  createdBy: varchar("created_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  updatedBy: varchar("updated_by", { length: 255 }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  deletedBy: varchar("deleted_by", { length: 255 }),
};
export const ProjectTable = pgTable("tbl_projects", {
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  ...commonTable,
});
export const enumTestSuiteStatus = pgEnum("test_suite_status", [
  "Not Run",
  "Running",
  "Completed",
  "Failed",
  "Aborted",
]);
export const TestSuiteTable = pgTable("tbl_test_suites", {
  projectId: varchar("project_id", { length: 255 }).notNull(),
  name: varchar().notNull(),
  description: text(),
  content: text(),
  totalTests: integer("total_tests"),
  passedTests: integer("passed_tests"),
  failedTests: integer("failed_tests"),
  lastRunDate: timestamp("last_run_date", { withTimezone: true, mode: "string" }),
  status: enumTestSuiteStatus(),
  progress: integer(),
  tags: text().array(),
  ...commonTable,
});
