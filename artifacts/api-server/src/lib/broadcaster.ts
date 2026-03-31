import type { Response } from "express";

type EventType = "timeslot" | "user" | "service" | "stats";

const clients = new Set<Response>();

export function registerClient(res: Response): () => void {
  clients.add(res);
  return () => clients.delete(res);
}

export function broadcast(type: EventType, data?: Record<string, unknown>): void {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data ?? {})}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}
