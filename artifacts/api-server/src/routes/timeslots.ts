import { Router, type IRouter } from "express";
import { db, timeslotsTable, usersTable, servicesTable } from "@workspace/db";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { broadcast } from "../lib/broadcaster";

const router: IRouter = Router();

async function enrichTimeslot(slot: typeof timeslotsTable.$inferSelect) {
  const [professional] = await db.select().from(usersTable).where(eq(usersTable.id, slot.professionalId)).limit(1);
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, slot.clientId)).limit(1);
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, slot.serviceId)).limit(1);
  return {
    ...slot,
    serviceName: service?.name ?? "",
    professionalName: professional?.name ?? "",
    clientName: client?.name ?? "",
  };
}

function getCurrentUser(req: any): number | null {
  return (req.session as Record<string, unknown>).userId as number | null ?? null;
}

router.get("/", async (req, res) => {
  try {
    const { status, professionalId, clientId } = req.query as {
      status?: string;
      professionalId?: string;
      clientId?: string;
    };

    const conditions: any[] = [];
    if (status) conditions.push(eq(timeslotsTable.status, status as any));
    if (professionalId) conditions.push(eq(timeslotsTable.professionalId, Number(professionalId)));
    if (clientId) conditions.push(eq(timeslotsTable.clientId, Number(clientId)));

    const slots = conditions.length > 0
      ? await db.select().from(timeslotsTable).where(and(...conditions))
      : await db.select().from(timeslotsTable);

    const enriched = await Promise.all(slots.map(enrichTimeslot));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { startTime, endTime, serviceId, professionalId, clientId, notes } = req.body;
    if (!startTime || !endTime || !serviceId || !professionalId || !clientId) {
      res.status(400).json({ error: "startTime, endTime, serviceId, professionalId, clientId are required" });
      return;
    }
    const [slot] = await db.insert(timeslotsTable).values({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      serviceId: Number(serviceId),
      professionalId: Number(professionalId),
      clientId: Number(clientId),
      notes,
    }).returning();
    const enriched = await enrichTimeslot(slot);
    broadcast("timeslot", { action: "created", id: slot.id });
    broadcast("stats", {});
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/overview", async (req, res) => {
  try {
    const allSlots = await db.select().from(timeslotsTable);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const clients = await db.select().from(usersTable).where(eq(usersTable.role, "client"));
    const professionals = await db.select().from(usersTable).where(eq(usersTable.role, "professional"));
    const services = await db.select().from(servicesTable);

    const todaySlots = allSlots.filter(
      (s) => s.startTime >= startOfDay && s.startTime < endOfDay && s.status === "scheduled"
    );

    res.json({
      totalScheduled: allSlots.filter((s) => s.status === "scheduled").length,
      totalDone: allSlots.filter((s) => s.status === "done").length,
      totalCancelled: allSlots.filter((s) => s.status === "cancelled").length,
      totalClients: clients.length,
      totalProfessionals: professionals.length,
      totalServices: services.length,
      upcomingToday: todaySlots.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [slot] = await db.select().from(timeslotsTable).where(eq(timeslotsTable.id, id)).limit(1);
    if (!slot) {
      res.status(404).json({ error: "Timeslot not found" });
      return;
    }
    const enriched = await enrichTimeslot(slot);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { startTime, endTime, serviceId, professionalId, clientId, notes, status } = req.body;
    const updates: Partial<typeof timeslotsTable.$inferInsert> = {};
    if (startTime) updates.startTime = new Date(startTime);
    if (endTime) updates.endTime = new Date(endTime);
    if (serviceId) updates.serviceId = Number(serviceId);
    if (professionalId) updates.professionalId = Number(professionalId);
    if (clientId) updates.clientId = Number(clientId);
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;
    const [updated] = await db.update(timeslotsTable).set(updates).where(eq(timeslotsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Timeslot not found" });
      return;
    }
    const enriched = await enrichTimeslot(updated);
    broadcast("timeslot", { action: "updated", id: updated.id });
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(timeslotsTable).where(eq(timeslotsTable.id, id));
    broadcast("timeslot", { action: "deleted", id });
    broadcast("stats", {});
    res.json({ success: true, message: "Timeslot deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status || !["scheduled", "done", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Valid status is required: scheduled, done, or cancelled" });
      return;
    }
    const [updated] = await db.update(timeslotsTable).set({ status }).where(eq(timeslotsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Timeslot not found" });
      return;
    }
    const enriched = await enrichTimeslot(updated);
    broadcast("timeslot", { action: "status_updated", id: updated.id, status: updated.status });
    broadcast("stats", {});
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
