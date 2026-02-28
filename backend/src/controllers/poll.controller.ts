import { Request, Response } from "express";
import { PollService } from "../services/poll.service";

const pollService = new PollService();

export async function getPollHistory(_req: Request, res: Response): Promise<void> {
  try {
    const polls = await pollService.getPollHistory();
    res.json(polls);
  } catch (err) {
    console.error("getPollHistory failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch poll history";
    res.status(500).json({ error: message });
  }
}
