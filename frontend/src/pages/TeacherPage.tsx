import React, { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { socket } from "../services/socket";

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
}

interface PollState {
  poll: Poll | null;
  remainingTimeMs: number;
}

const containerStyle: React.CSSProperties = {
  padding: "16px",
  fontFamily: "sans-serif"
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "16px"
};

export default function TeacherPage() {
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [duration, setDuration] = useState<number>(60);
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handlePollState = (state: PollState) => {
      setPollState(state);
    };

    socket.on("poll_state", handlePollState);
    socket.emit("get_active_poll");

    return () => {
      socket.off("poll_state", handlePollState);
    };
  }, []);

  useEffect(() => {
    if (!pollState || typeof pollState.remainingTimeMs !== "number") {
      setRemainingSeconds(0);
      return;
    }

    const initialSeconds = Math.floor(pollState.remainingTimeMs / 1000);
    setRemainingSeconds(initialSeconds);

    if (initialSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollState?.remainingTimeMs]);

  const handleOptionChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const next = [...options];
    next[index] = event.target.value;
    setOptions(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim());

    if (!trimmedQuestion) return;
    if (trimmedOptions.some((o) => !o)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const durationMs = duration * 1000;

    socket.emit("create_poll", {
      question: trimmedQuestion,
      options: trimmedOptions,
      duration: durationMs
    });
  };

  const poll = pollState?.poll ?? null;

  return (
    <div style={containerStyle}>
      <h2>Teacher Page</h2>

      <form onSubmit={handleSubmit} style={sectionStyle}>
        <div style={sectionStyle}>
          <label>
            Question
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        </div>

        <div style={sectionStyle}>
          <div>Options</div>
          {options.map((opt, index) => (
            <div key={index} style={{ marginTop: 4 }}>
              <label>
                Option {index + 1}
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e)}
                  style={{ display: "block", width: "100%", marginTop: 2 }}
                />
              </label>
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <label>
            Duration (seconds)
            <input
              type="number"
              value={duration}
              min={1}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ display: "block", marginTop: 4 }}
            />
          </label>
        </div>

        <button type="submit">Create Poll</button>
      </form>

      {poll && (
        <div style={sectionStyle}>
          <h3>Active Poll</h3>
          <p>
            <strong>Question:</strong> {poll.question}
          </p>
          <p>
            <strong>Remaining time:</strong> {remainingSeconds} seconds
          </p>
          <div>
            <strong>Options:</strong>
            <ul>
              {poll.options.map((option, index) => (
                <li key={index}>
                  {option.text} - {option.votes} votes
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

