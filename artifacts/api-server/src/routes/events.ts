import { Router, type IRouter, type Request, type Response } from "express";
import { registerClient } from "../lib/broadcaster";

const router: IRouter = Router();

router.get("/", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(":connected\n\n");

  const unregister = registerClient(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(":ping\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregister();
  });
});

export default router;
