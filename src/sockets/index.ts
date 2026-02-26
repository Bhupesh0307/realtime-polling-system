import { Server as SocketIOServer } from "socket.io";
import { registerPollSocketHandlers } from "./poll.socket";

export function registerSocketHandlers(io: SocketIOServer): void {
  registerPollSocketHandlers(io);
}

