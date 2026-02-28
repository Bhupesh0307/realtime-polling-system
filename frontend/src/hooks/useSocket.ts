import { useEffect, useState, useCallback } from "react";
import { socket } from "../services/socket";

export interface PollOptionShape {
  text: string;
  votes: number;
}

export interface PollShape {
  _id?: string;
  question: string;
  options: PollOptionShape[];
}

export interface PollStateShape {
  poll: PollShape | null;
  remainingTimeMs: number;
}

export interface StudentSummaryShape {
  socketId: string;
  name: string;
}

export interface ChatMessageShape {
  sender: string;
  message: string;
  timestamp: number;
}

const ERROR_DISMISS_MS = 5000;

export type SocketRole = "teacher" | "student";

export interface UseSocketBaseConfig {
  role: SocketRole;
}

export interface UseSocketTeacherConfig extends UseSocketBaseConfig {
  role: "teacher";
}

export interface UseSocketStudentConfig extends UseSocketBaseConfig {
  role: "student";
  /** Restored from session; hook will emit register_student if set */
  initialStudentName?: string | null;
}

export type UseSocketConfig = UseSocketTeacherConfig | UseSocketStudentConfig;

export interface UseSocketReturn {
  pollState: PollStateShape | null;
  error: string | null;
  students: StudentSummaryShape[];
  messages: ChatMessageShape[];
  removedByTeacher: boolean;
  createPoll: (question: string, options: string[], durationMs: number) => void;
  kickStudent: (studentSocketId: string) => void;
  registerStudent: (studentName: string) => void;
  submitVote: (pollId: string, studentName: string, selectedOptionIndex: number) => void;
  sendChat: (sender: string, message: string) => void;
  requestActivePoll: () => void;
  requestStudentList: () => void;
}

export function useSocket(config: UseSocketConfig): UseSocketReturn {
  const { role } = config;
  const [pollState, setPollState] = useState<PollStateShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummaryShape[]>([]);
  const [messages, setMessages] = useState<ChatMessageShape[]>([]);
  const [removedByTeacher, setRemovedByTeacher] = useState(false);

  const showError = useCallback((msg: string) => {
    setError(msg);
    window.setTimeout(() => {
      setError((current) => (current === msg ? null : current));
    }, ERROR_DISMISS_MS);
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onPollState = (state: PollStateShape) => setPollState(state);
    const onError = (message: string) => showError(message);
    const onStudentList = (list: StudentSummaryShape[]) => setStudents(list);
    const onChatMessage = (msg: ChatMessageShape) => {
      setMessages((prev) => [...prev, msg]);
    };
    const onConnectError = () => {
      showError("Connection failed. Check your network and try again.");
    };

    socket.on("poll_state", onPollState);
    socket.on("error_message", onError);
    socket.on("student_list_update", onStudentList);
    socket.on("chat_message", onChatMessage);
    socket.on("connect_error", onConnectError);

    if (role === "teacher") {
      socket.emit("register_teacher");
    }
    if (role === "student") {
      const name = (config as UseSocketStudentConfig).initialStudentName?.trim();
      if (name) {
        socket.emit("register_student", { studentName: name });
      }
    }

    socket.emit("get_active_poll");
    socket.emit("get_student_list");

    if (role === "student") {
      const onRemoved = () => {
        setRemovedByTeacher(true);
        socket.disconnect();
      };
      socket.on("removed_by_teacher", onRemoved);
      return () => {
        socket.off("poll_state", onPollState);
        socket.off("error_message", onError);
        socket.off("student_list_update", onStudentList);
        socket.off("chat_message", onChatMessage);
        socket.off("removed_by_teacher", onRemoved);
        socket.off("connect_error", onConnectError);
      };
    }

    return () => {
      socket.off("poll_state", onPollState);
      socket.off("error_message", onError);
      socket.off("student_list_update", onStudentList);
      socket.off("chat_message", onChatMessage);
      socket.off("connect_error", onConnectError);
    };
  }, [role, showError]);

  const createPoll = useCallback((question: string, options: string[], durationMs: number) => {
    socket.emit("create_poll", { question, options, duration: durationMs });
  }, []);

  const kickStudent = useCallback((studentSocketId: string) => {
    socket.emit("remove_student", { studentSocketId });
  }, []);

  const registerStudent = useCallback((studentName: string) => {
    socket.emit("register_student", { studentName });
  }, []);

  const submitVote = useCallback((pollId: string, studentName: string, selectedOptionIndex: number) => {
    socket.emit("submit_vote", { pollId, studentName, selectedOptionIndex });
  }, []);

  const sendChat = useCallback((sender: string, message: string) => {
    socket.emit("chat_message", { sender, message });
  }, []);

  const requestActivePoll = useCallback(() => {
    socket.emit("get_active_poll");
  }, []);

  const requestStudentList = useCallback(() => {
    socket.emit("get_student_list");
  }, []);

  return {
    pollState,
    error,
    students,
    messages,
    removedByTeacher,
    createPoll,
    kickStudent,
    registerStudent,
    submitVote,
    sendChat,
    requestActivePoll,
    requestStudentList,
  };
}
