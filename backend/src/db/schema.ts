import { jsonb, pgEnum, timestamp, varchar } from "drizzle-orm/pg-core";

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
