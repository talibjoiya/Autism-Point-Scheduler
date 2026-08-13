import { Router, type IRouter, type Request } from "express";
import { asc, eq } from "drizzle-orm";
import {
  appointmentCommentsTable,
  db,
  timeslotsTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

function getCurrentUserId(req: Request): number | null {
  return (req.session as unknown as Record<string, unknown>).userId as number | null ?? null;
}

async function getAppointment(id: number) {
  const [appointment] = await db
    .select()
    .from(timeslotsTable)
    .where(eq(timeslotsTable.id, id))
    .limit(1);
  return appointment;
}

async function getUser(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return user;
}

async function listEnrichedComments(timeslotId: number) {
  const comments = await db
    .select()
    .from(appointmentCommentsTable)
    .where(eq(appointmentCommentsTable.timeslotId, timeslotId))
    .orderBy(asc(appointmentCommentsTable.createdAt));

  return Promise.all(
    comments.map(async (comment) => {
      const professional = await getUser(comment.professionalId);
      return {
        ...comment,
        professionalName: professional?.name ?? "Professional",
      };
    }),
  );
}

router.get("/:id/comments", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const appointment = await getAppointment(id);
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const user = await getUser(userId);
    const canView =
      user?.role === "admin" ||
      appointment.professionalId === userId ||
      appointment.clientId === userId;
    if (!canView) {
      res.status(403).json({ error: "You are not allowed to view these comments" });
      return;
    }

    res.json(await listEnrichedComments(id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/comments", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const appointment = await getAppointment(id);
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const user = await getUser(userId);
    if (user?.role !== "professional" || appointment.professionalId !== userId) {
      res.status(403).json({ error: "Only the assigned professional can post comments" });
      return;
    }
    if (appointment.status !== "done") {
      res.status(400).json({ error: "Comments can only be posted after an appointment is marked done" });
      return;
    }

    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 2000) {
      res.status(400).json({ error: "Comment must be between 1 and 2000 characters" });
      return;
    }

    const [comment] = await db
      .insert(appointmentCommentsTable)
      .values({
        timeslotId: id,
        professionalId: userId,
        content,
      })
      .returning();

    res.status(201).json({
      ...comment,
      professionalName: user.name,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;