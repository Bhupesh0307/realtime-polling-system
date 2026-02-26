import { Server as SocketIOServer, Socket } from "socket.io";
import { PollService } from "../services/poll.service";

const pollService = new PollService();

export function registerPollSocketHandlers(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("create_poll", async (payload: { question: string; options: string[]; duration: number }) => {
      try {
        const { question, options, duration } = payload ?? {};
        if (!question || !Array.isArray(options) || typeof duration !== "number") {
          socket.emit("error_message", "Invalid payload: question, options (array), and duration (number) required");
          return;
        }

        await pollService.createPoll(question, options, duration);
        const state = await pollService.getActivePoll();
        io.emit("poll_state", state);
      } catch (err) {
        socket.emit("error_message", err instanceof Error ? err.message : "Unknown error");
      }
    });

    socket.on("get_active_poll", async () => {
      try {
        const state = await pollService.getActivePoll();
        socket.emit("poll_state", state);
      } catch (err) {
        socket.emit("error_message", err instanceof Error ? err.message : "Unknown error");
      }
    });

    socket.on("submit_vote", async (payload: { pollId: string; studentName: string; selectedOptionIndex: number }) => {
      try {
        const { pollId, studentName, selectedOptionIndex } = payload ?? {};
        if (typeof pollId !== "string" || typeof studentName !== "string" || typeof selectedOptionIndex !== "number") {
          socket.emit("error_message", "Invalid payload: pollId, studentName, and selectedOptionIndex required");
          return;
        }

        await pollService.submitVote(pollId, studentName, selectedOptionIndex);
        const state = await pollService.getActivePoll();
        io.emit("poll_state", state);
      } catch (err) {
        socket.emit("error_message", err instanceof Error ? err.message : "Unknown error");
      }
    });

    (async () => {
      try {
        const state = await pollService.getActivePoll();
        socket.emit("poll_state", state);
      } catch (err) {
        socket.emit("error_message", err instanceof Error ? err.message : "Unknown error");
      }
    })();
  });
}
