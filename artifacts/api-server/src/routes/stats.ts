import { Router, type IRouter } from "express";
import { db, timeslotsTable, usersTable, servicesTable } from "@workspace/db";
import { eq, gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/overview", async (req, res) => {
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

export default router;
