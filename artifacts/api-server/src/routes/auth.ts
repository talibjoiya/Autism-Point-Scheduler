import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { password: _pw, ...rest } = user;
  return rest;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    (req.session as Record<string, unknown>).userId = user.id;
    res.json({ user: sanitizeUser(user), message: "Login successful" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/me", async (req, res) => {
  try {
    const userId = (req.session as Record<string, unknown>).userId as number | undefined;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
