import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const clientProgressTable = pgTable(
  "client_progress",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    progress: integer("progress").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientItemNameUnique: uniqueIndex("client_progress_client_item_name_idx").on(
      table.clientId,
      table.itemName,
    ),
  }),
);

export const insertClientProgressSchema = createInsertSchema(clientProgressTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientProgress = z.infer<typeof insertClientProgressSchema>;
export type ClientProgress = typeof clientProgressTable.$inferSelect;