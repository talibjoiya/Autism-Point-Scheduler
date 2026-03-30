import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { servicesTable } from "./services";

export const timeslotsTable = pgTable("timeslots", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status", { enum: ["scheduled", "done", "cancelled"] }).notNull().default("scheduled"),
  notes: text("notes"),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  professionalId: integer("professional_id").notNull().references(() => usersTable.id),
  clientId: integer("client_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimeslotSchema = createInsertSchema(timeslotsTable).omit({ id: true, createdAt: true, status: true });
export type InsertTimeslot = z.infer<typeof insertTimeslotSchema>;
export type Timeslot = typeof timeslotsTable.$inferSelect;
