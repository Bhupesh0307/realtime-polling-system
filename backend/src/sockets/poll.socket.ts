import { Server as SocketIOServer, Socket } from "socket.io";
import { PollService } from "../services/poll.service";

const pollService = new PollService();

const activeStudents: Map<string, string> = new Map();
let teacherSocketId: string | null = null;

export function getActiveStudentCount(): number {
  return activeStudents.size;
}

export function getActiveStudents(): { socketId: string; name: string }[] {
  return Array.from(activeStudents.entries()).map(([socketId, name]) => ({
    socketId,
    name
  }));
}

export function registerPollSocketHandlers(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on(
      "create_poll",
      async (payload: { question: string; options: string[]; duration: number }) => {
        try {
          const { question, options, duration } = payload ?? {};
          if (!question || !Array.isArray(options) || typeof duration !== "number") {
            socket.emit(
              "error_message",
              "Invalid payload: question, options (array), and duration (number) required"
            );
            return;
          }

          const activeStudentCount = getActiveStudentCount();

          await pollService.createPoll(question, options, duration, activeStudentCount);
          const state = await pollService.getActivePoll();
          io.emit("poll_state", state);
        } catch (err) {
          socket.emit(
            "error_message",
            err instanceof Error ? err.message : "Unknown error"
          );
        }
      }
    );

    socket.on("register_teacher", () => {
      teacherSocketId = socket.id;
    });

    socket.on("get_active_poll", async () => {
      try {
        const state = await pollService.getActivePoll();
        socket.emit("poll_state", state);
      } catch (err) {
        socket.emit(
          "error_message",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    });

    socket.on(
      "register_student",
      (payload: { studentName: string } | null | undefined) => {
        const name = payload?.studentName;
        if (typeof name !== "string" || !name.trim()) {
          socket.emit("error_message", "Invalid payload: studentName is required");
          return;
        }
        const trimmed = name.trim();
        activeStudents.set(socket.id, trimmed);
        console.log(
          "Student connected:",
          trimmed,
          "Total:",
          activeStudents.size
        );
        io.emit("student_list_update", getActiveStudents());
      }
    );

    socket.on("get_student_list", () => {
      socket.emit("student_list_update", getActiveStudents());
    });

    socket.on(
      "submit_vote",
      async (payload: {
        pollId: string;
        studentName: string;
        selectedOptionIndex: number;
      }) => {
        try {
          const { pollId, studentName, selectedOptionIndex } = payload ?? {};
          if (
            typeof pollId !== "string" ||
            typeof studentName !== "string" ||
            typeof selectedOptionIndex !== "number"
          ) {
            socket.emit(
              "error_message",
              "Invalid payload: pollId, studentName, and selectedOptionIndex required"
            );
            return;
          }

          await pollService.submitVote(pollId, studentName, selectedOptionIndex);
          const state = await pollService.getActivePoll();
          io.emit("poll_state", state);
        } catch (err) {
          socket.emit(
            "error_message",
            err instanceof Error ? err.message : "Unknown error"
          );
        }
      }
    );

    socket.on(
      "chat_message",
      (payload: { sender: string; message: string } | null | undefined) => {
        const sender = payload?.sender;
        const message = payload?.message;

        if (typeof sender !== "string" || !sender.trim()) {
          socket.emit("error_message", "Invalid payload: sender is required");
          return;
        }
        if (typeof message !== "string" || !message.trim()) {
          socket.emit("error_message", "Invalid payload: message is required");
          return;
        }

        io.emit("chat_message", {
          sender: sender.trim(),
          message: message.trim(),
          timestamp: Date.now()
        });
      }
    );

    socket.on(
      "remove_student",
      (payload: { studentSocketId: string } | null | undefined) => {
        const studentSocketId = payload?.studentSocketId;
        if (typeof studentSocketId !== "string" || !studentSocketId) {
          socket.emit("error_message", "Invalid payload: studentSocketId is required");
          return;
        }

        if (!teacherSocketId || socket.id !== teacherSocketId) {
          socket.emit("error_message", "Only the teacher can remove students");
          return;
        }

        const studentName = activeStudents.get(studentSocketId);
        if (!studentName) {
          socket.emit("error_message", "Student not found or already disconnected");
          return;
        }

        io.to(studentSocketId).emit("removed_by_teacher");
        const targetSocket = io.sockets.sockets.get(studentSocketId);
        if (targetSocket) {
          targetSocket.disconnect(true);
        }

        activeStudents.delete(studentSocketId);
        console.log("Student removed:", studentName);
        io.emit("student_list_update", getActiveStudents());
      }
    );

    socket.on("disconnect", () => {
      const existingName = activeStudents.get(socket.id);
      activeStudents.delete(socket.id);
      if (existingName) {
        console.log(
          "Student disconnected:",
          existingName,
          "Total:",
          activeStudents.size
        );
        io.emit("student_list_update", getActiveStudents());
      }
    });

    (async () => {
      try {
        const state = await pollService.getActivePoll();
        socket.emit("poll_state", state);
      } catch (err) {
        socket.emit(
          "error_message",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    })();
  });
}
