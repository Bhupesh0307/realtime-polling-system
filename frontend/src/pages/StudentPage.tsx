import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { socket } from "../services/socket";

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
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

export default function StudentPage() {
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
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

  const poll = pollState?.poll ?? null;
  const isPollActive = !!poll && remainingSeconds > 0;
  const canVote = isPollActive && studentName.trim().length > 0;

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

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStudentName(event.target.value);
  };

  const handleVote = (index: number) => {
    setSelectedOption(index);

    if (!canVote || !poll) return;

    const pollId = poll._id;

    socket.emit("submit_vote", {
      pollId,
      studentName: studentName.trim(),
      selectedOptionIndex: index
    });
  };

  return (
    <div style={containerStyle}>
      <h2>Student Page</h2>

      {!poll && <p>No active poll</p>}

      {poll && (
        <div style={sectionStyle}>
          <p>
            <strong>Question:</strong> {poll.question}
          </p>
          <p>
            <strong>Remaining time:</strong> {remainingSeconds} seconds
          </p>

          <div style={sectionStyle}>
            <label>
              Your name
              <input
                type="text"
                value={studentName}
                onChange={handleNameChange}
                style={{ display: "block", marginTop: 4, marginBottom: 8 }}
              />
            </label>
          </div>

          <div>
            <strong>Options:</strong>
            <div>
              {poll.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleVote(index)}
                  disabled={!canVote}
                  style={{
                    display: "block",
                    marginTop: 4,
                    backgroundColor: selectedOption === index ? "#ddd" : "#f5f5f5"
                  }}
                >
                  {option.text} ({option.votes} votes)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

