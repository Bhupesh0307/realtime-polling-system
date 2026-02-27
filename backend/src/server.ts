import http from "http";
import express, { Application } from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { PORT, MONGO_URI } from "./config/env";
import { connectDB } from "./utils/db";
import { registerSocketHandlers } from "./sockets/index";
import { Poll } from "./models/Poll";
import "dotenv/config";

async function bootstrap() {
  const app: Application = express();

  app.use(cors());
  app.use(express.json());


  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  registerSocketHandlers(io);

  await connectDB();

  app.get("/api/polls/history", async (_req, res) => {
    try {
      const polls = await Poll.find({ status: "completed" }).sort({ createdAt: -1 });
      res.json(polls);
    } catch {
      res.status(500).json({ error: "Failed to fetch poll history" });
    }
  });

  server.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

