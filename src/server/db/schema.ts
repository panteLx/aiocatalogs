// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 * NOTE: cloudflare_ is the prefix for the table names, you can change it
 */
export const createTable = sqliteTableCreator((name) => `cloudflare_${name}`);

export const userConfigs = createTable(
  "user_configs",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().unique(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    userIdIndex: index("user_id_idx").on(table.userId),
  }),
);

export const catalogs = createTable(
  "catalogs",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    manifestUrl: text("manifest_url").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    originalManifest: text("original_manifest", { mode: "json" }).notNull(),
    status: text("status", { enum: ["active", "inactive"] })
      .default("active")
      .notNull(),
    randomized: int("randomized", { mode: "boolean" }).default(false).notNull(),
    order: int("order").notNull().default(0),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    userIdIndex: index("catalog_user_id_idx").on(table.userId),
    orderIndex: index("catalog_order_idx").on(table.userId, table.order),
  }),
);
