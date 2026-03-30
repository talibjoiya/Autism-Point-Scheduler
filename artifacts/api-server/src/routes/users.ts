import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { password: _pw, ...rest } = user;
  return rest;
}

function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req._userId = userId;
  next();
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { role } = req.query as { role?: string };
    let query = db.select().from(usersTable);
    const users = await query;
    const filtered = role ? users.filter((u) => u.role === role) : users;
    res.json(filtered.map(sanitizeUser));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "name, email, password, role are required" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const [user] = await db.insert(usersTable).values({ name, email, password, role, phone }).returning();
    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, role } = req.body;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (role) updates.role = role;
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
