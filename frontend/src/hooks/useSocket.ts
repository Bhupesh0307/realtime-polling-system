import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export interface PollState {
  poll: any;
  remainingTimeMs: number;
}

export const useSocket = () => {
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.connect();

    socket.on("poll_state", (data: PollState) => {
      setPollState(data);
    });

    socket.on("error_message", (message: string) => {
      setError(message);
    });

    return () => {
      socket.off("poll_state");
      socket.off("error_message");
    };
  }, []);

  const createPoll = (question: string, options: string[], duration: number) => {
    socket.emit("create_poll", { question, options, duration });
  };

  const submitVote = (pollId: string, studentName: string, selectedOptionIndex: number) => {
    socket.emit("submit_vote", { pollId, studentName, selectedOptionIndex });
  };

  const fetchActivePoll = () => {
    socket.emit("get_active_poll");
  };

  return {
    pollState,
    error,
    createPoll,
    submitVote,
    fetchActivePoll,
  };
};