import { Router, type IRouter } from "express";
import { and, asc, eq, ne } from "drizzle-orm";
import { clientProgressTable, db, usersTable } from "@workspace/db";
import { broadcast } from "../lib/broadcaster";

const router: IRouter = Router();

const DEFAULT_PROGRESS_ITEMS = [
  "Command following",
  "Eye contact",
  "Fine motor",
  "Communication",
  "Social interaction",
];

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
    if (user.role === "client") {
      await db.insert(clientProgressTable).values(
        DEFAULT_PROGRESS_ITEMS.map((itemName) => ({
          clientId: user.id,
          itemName,
          progress: 0,
        })),
      );
    }
    broadcast("user", { action: "created", id: user.id });
    broadcast("stats", {});
    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/progress/bulk", async (req, res) => {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!canManageProgress(currentUser)) {
      res.status(403).json({ error: "Only admins and professionals can manage progress" });
      return;
    }

    const itemName = typeof req.body?.itemName === "string" ? req.body.itemName.trim() : "";
    const progress = parseProgress(req.body?.progress);
    const notes = req.body?.notes === undefined ? null : String(req.body.notes).trim() || null;
    if (!itemName || itemName.length > 80 || progress === null) {
      res.status(400).json({ error: "Item name and progress from 0 to 100 are required" });
      return;
    }

    const clients = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "client"));
    const existing = await db
      .select({ clientId: clientProgressTable.clientId })
      .from(clientProgressTable)
      .where(eq(clientProgressTable.itemName, itemName));
    const existingClientIds = new Set(existing.map((item) => item.clientId));
    const values = clients
      .filter((client) => !existingClientIds.has(client.id))
      .map((client) => ({ clientId: client.id, itemName, progress, notes }));

    if (values.length) {
      await db.insert(clientProgressTable).values(values);
    }

    res.status(201).json({
      created: values.length,
      skipped: clients.length - values.length,
      total: clients.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function getSessionUser(req: any) {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user ?? null;
}

async function getClient(id: number) {
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return client?.role === "client" ? client : null;
}

function canManageProgress(user: typeof usersTable.$inferSelect | null) {
  return user?.role === "admin" || user?.role === "professional";
}

function parseProgress(value: unknown, fallback = 0) {
  if (value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

function progressSummary(clientId: number, items: Array<typeof clientProgressTable.$inferSelect>) {
  const overallProgress = items.length
    ? Math.round(items.reduce((total, item) => total + item.progress, 0) / items.length)
    : 0;
  return { clientId, overallProgress, items };
}

router.get("/:id/progress", async (req, res) => {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const clientId = Number(req.params.id);
    const client = await getClient(clientId);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const canView = canManageProgress(currentUser) || currentUser.id === clientId;
    if (!canView) {
      res.status(403).json({ error: "You are not allowed to view this client's progress" });
      return;
    }

    const items = await db
      .select()
      .from(clientProgressTable)
      .where(eq(clientProgressTable.clientId, clientId))
      .orderBy(asc(clientProgressTable.createdAt), asc(clientProgressTable.id));

    res.json(progressSummary(clientId, items));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/progress", async (req, res) => {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!canManageProgress(currentUser)) {
      res.status(403).json({ error: "Only admins and professionals can manage progress" });
      return;
    }

    const clientId = Number(req.params.id);
    const client = await getClient(clientId);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const itemName = typeof req.body?.itemName === "string" ? req.body.itemName.trim() : "";
    const progress = parseProgress(req.body?.progress);
    const notes = req.body?.notes === undefined ? null : String(req.body.notes).trim() || null;
    if (!itemName || itemName.length > 80 || progress === null) {
      res.status(400).json({ error: "Item name and progress from 0 to 100 are required" });
      return;
    }

    const [matching] = await db
      .select({ id: clientProgressTable.id })
      .from(clientProgressTable)
      .where(and(
        eq(clientProgressTable.clientId, clientId),
        eq(clientProgressTable.itemName, itemName),
      ))
      .limit(1);
    if (matching) {
      res.status(409).json({ error: "This progress item already exists for the client" });
      return;
    }

    const [item] = await db
      .insert(clientProgressTable)
      .values({ clientId, itemName, progress, notes })
      .returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/progress/:progressId", async (req, res) => {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!canManageProgress(currentUser)) {
      res.status(403).json({ error: "Only admins and professionals can manage progress" });
      return;
    }

    const clientId = Number(req.params.id);
    const progressId = Number(req.params.progressId);
    const client = await getClient(clientId);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(clientProgressTable)
      .where(eq(clientProgressTable.id, progressId))
      .limit(1);
    if (!existing || existing.clientId !== clientId) {
      res.status(404).json({ error: "Progress item not found" });
      return;
    }

    const itemName =
      req.body?.itemName === undefined
        ? existing.itemName
        : typeof req.body.itemName === "string"
          ? req.body.itemName.trim()
          : "";
    const progress = parseProgress(req.body?.progress, existing.progress);
    const notes =
      req.body?.notes === undefined
        ? existing.notes
        : String(req.body.notes).trim() || null;
    if (!itemName || itemName.length > 80 || progress === null) {
      res.status(400).json({ error: "Item name and progress from 0 to 100 are required" });
      return;
    }

    const [duplicate] = await db
      .select({ id: clientProgressTable.id })
      .from(clientProgressTable)
      .where(and(
        eq(clientProgressTable.clientId, clientId),
        eq(clientProgressTable.itemName, itemName),
        ne(clientProgressTable.id, progressId),
      ))
      .limit(1);
    if (duplicate) {
      res.status(409).json({ error: "This progress item already exists for the client" });
      return;
    }

    const [updated] = await db
      .update(clientProgressTable)
      .set({ itemName, progress, notes, updatedAt: new Date() })
      .where(eq(clientProgressTable.id, progressId))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/progress/:progressId", async (req, res) => {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!canManageProgress(currentUser)) {
      res.status(403).json({ error: "Only admins and professionals can manage progress" });
      return;
    }

    const clientId = Number(req.params.id);
    const progressId = Number(req.params.progressId);
    const [deleted] = await db
      .delete(clientProgressTable)
      .where(and(
        eq(clientProgressTable.id, progressId),
        eq(clientProgressTable.clientId, clientId),
      ))
      .returning({ id: clientProgressTable.id, clientId: clientProgressTable.clientId });
    if (!deleted) {
      res.status(404).json({ error: "Progress item not found" });
      return;
    }
    res.json({ success: true, message: "Progress item deleted" });
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
    broadcast("user", { action: "updated", id: updated.id });
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
    broadcast("user", { action: "deleted", id });
    broadcast("stats", {});
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
