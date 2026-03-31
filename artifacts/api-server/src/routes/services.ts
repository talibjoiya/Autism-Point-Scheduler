import { Router, type IRouter } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/broadcaster";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    res.json(services.map((s) => ({
      ...s,
      price: s.price ? Number(s.price) : null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, durationMinutes, price } = req.body;
    if (!name || !durationMinutes) {
      res.status(400).json({ error: "name and durationMinutes are required" });
      return;
    }
    const [service] = await db.insert(servicesTable).values({
      name,
      description,
      durationMinutes,
      price: price !== undefined ? String(price) : undefined,
    }).returning();
    broadcast("service", { action: "created", id: service.id });
    broadcast("stats", {});
    res.status(201).json({ ...service, price: service.price ? Number(service.price) : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id)).limit(1);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json({ ...service, price: service.price ? Number(service.price) : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, durationMinutes, price } = req.body;
    const updates: Partial<typeof servicesTable.$inferInsert> = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (durationMinutes) updates.durationMinutes = durationMinutes;
    if (price !== undefined) updates.price = price !== null ? String(price) : undefined;
    const [updated] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    broadcast("service", { action: "updated", id: updated.id });
    res.json({ ...updated, price: updated.price ? Number(updated.price) : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    broadcast("service", { action: "deleted", id });
    broadcast("stats", {});
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
