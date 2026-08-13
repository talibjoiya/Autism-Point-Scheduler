import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { timeslotsTable } from "./timeslots";
import { usersTable } from "./users";

export const appointmentCommentsTable = pgTable("appointment_comments", {
  id: serial("id").primaryKey(),
  timeslotId: integer("timeslot_id").notNull().references(() => timeslotsTable.id, { onDelete: "cascade" }),
  professionalId: integer("professional_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentCommentSchema = createInsertSchema(appointmentCommentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAppointmentComment = z.infer<typeof insertAppointmentCommentSchema>;
export type AppointmentComment = typeof appointmentCommentsTable.$inferSelect;