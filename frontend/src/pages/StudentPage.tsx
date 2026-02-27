import { useEffect, useRef, useState } from "react";
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

interface StudentSummary {
  socketId: string;
  name: string;
}

export default function StudentPage() {
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [, setError] = useState<string | null>(null);
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [removedByTeacher, setRemovedByTeacher] = useState(false);
  const [messages, setMessages] = useState<
    { sender: string; message: string; timestamp: number }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "participants">("chat");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const previousPollIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Restore student name from sessionStorage and re-register if present
    const storedName = sessionStorage.getItem("student_name");
    if (storedName && storedName.trim().length > 0) {
      setStudentName(storedName);
      setHasEnteredName(true);
      socket.emit("register_student", { studentName: storedName });
    }

    const handlePollState = (state: PollState) => {
      setPollState(state);
    };

    const handleErrorMessage = (message: string) => {
      setError(message);
      window.setTimeout(() => {
        setError((current) => (current === message ? null : current));
      }, 5000);
    };

    const handleRemovedByTeacher = () => {
      setRemovedByTeacher(true);
      setHasVoted(true);
      socket.disconnect();
    };

    const handleChatMessage = (msg: {
      sender: string;
      message: string;
      timestamp: number;
    }) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleStudentListUpdate = (list: StudentSummary[]) => {
      setStudents(list);
    };

    socket.on("poll_state", handlePollState);
    socket.on("error_message", handleErrorMessage);
    socket.on("removed_by_teacher", handleRemovedByTeacher);
    socket.on("chat_message", handleChatMessage);
    socket.on("student_list_update", handleStudentListUpdate);
    socket.emit("get_active_poll");
    socket.emit("get_student_list"); 

    return () => {
      socket.off("poll_state", handlePollState);
      socket.off("error_message", handleErrorMessage);
      socket.off("removed_by_teacher", handleRemovedByTeacher);
      socket.off("chat_message", handleChatMessage);
      socket.off("student_list_update", handleStudentListUpdate);
    };
  }, []);

  const poll = pollState?.poll ?? null;
  const isPollActive = !!poll && remainingSeconds > 0;
  const canVote =
    isPollActive && studentName.trim().length > 0 && !hasVoted;
  const showResults = hasVoted || !isPollActive;

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

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStudentName(event.target.value);
  };
  const handleContinue = () => {
    const trimmed = studentName.trim();
    if (trimmed.length === 0) return;
    sessionStorage.setItem("student_name", trimmed);
    socket.emit("register_student", { studentName: trimmed });
    setHasEnteredName(true);
  };

  const handleVote = (index: number) => {
    if (hasVoted) return;

    setSelectedOption(index);

    if (!canVote || !poll) return;

    setHasVoted(true);

    const pollId = poll._id;

    sessionStorage.setItem("voted_poll_id", pollId);

    socket.emit("submit_vote", {
      pollId,
      studentName: studentName.trim(),
      selectedOptionIndex: index
    });
  };

  // Track stored vote status for the current poll
  useEffect(() => {
    const pollId = poll?._id ?? null;
    const storedVotedPollId = sessionStorage.getItem("voted_poll_id");

    if (pollId) {
      if (storedVotedPollId === pollId) {
        setHasVoted(true);
      } else if (previousPollIdRef.current && previousPollIdRef.current !== pollId) {
        // Poll changed, clear stored vote info and reset local vote state
        sessionStorage.removeItem("voted_poll_id");
        setHasVoted(false);
        setSelectedOption(null);
      }
    }

    previousPollIdRef.current = pollId;
  }, [poll?._id]);

  if (removedByTeacher) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex items-center justify-center">
            <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
              ✦ Intervue Poll
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
            You were removed by the teacher.
          </h1>
          <p className="text-sm text-slate-500">
            You can no longer participate in this poll session.
          </p>
        </div>
      </div>
    );
  }

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    const name = studentName.trim() || "Student";
    if (!trimmed) return;
    socket.emit("chat_message", { sender: name, message: trimmed });
    setChatInput("");
  };

  const chatPanel = (
    <>
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center text-white text-xl"
      >
        💬
      </button>

      {isChatOpen && !removedByTeacher && (
        <div className="fixed bottom-20 right-6 z-40 w-80 max-w-full rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setChatTab("chat")}
              className={`flex-1 py-2 text-xs font-medium ${
                chatTab === "chat"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-slate-500"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setChatTab("participants")}
              className={`flex-1 py-2 text-xs font-medium ${
                chatTab === "participants"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-slate-500"
              }`}
            >
              Participants
            </button>
          </div>

          {chatTab === "chat" ? (
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-xs">
                {messages.map((m, idx) => {
                  const isSelf = m.sender === studentName.trim();
                  return (
                    <div
                      key={idx}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                          isSelf
                            ? "bg-purple-600 text-white text-right"
                            : "bg-slate-800 text-white text-left"
                        }`}
                      >
                        <div className="text-[10px] opacity-75 mb-0.5">
                          {isSelf ? "You" : m.sender}
                        </div>
                        <div className="text-[11px] leading-snug">{m.message}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-slate-200 px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  className="text-xs font-medium text-purple-600"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col">
              <div className="grid grid-cols-[1fr_auto] px-4 py-2 border-b border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Name</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {students.length === 0 && (
                  <div className="px-4 py-4 text-[11px] text-slate-400">
                    No active participants yet.
                  </div>
                )}
                {students.map((s) => (
                  <div
                    key={s.socketId}
                    className="px-4 py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  // STEP 1: NAME ENTRY SCREEN
  // STEP 1: NAME ENTRY SCREEN
if (!hasEnteredName) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 inline-flex items-center justify-center">
          <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
            ✦ Intervue Poll
          </span>
        </div>

        <h1 className="text-4xl font-light mb-4 text-slate-900 tracking-tight">
          Let's <span className="font-bold">Get Started</span>
        </h1>

        <p className="text-sm leading-relaxed text-slate-500 mb-10 max-w-md mx-auto">
          If you're a student, you'll be able to{" "}
          <strong className="text-slate-700 font-semibold">submit your answers</strong>
          , participate in live polls, and see how your responses compare with your
          classmates
        </p>

        <div className="text-left mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter your Name
          </label>
          <input
            type="text"
            placeholder="Rahul Bajaj"
            value={studentName}
            onChange={handleNameChange}
            className="w-full px-4 py-3.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <button
          onClick={handleContinue}
          className="px-14 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_18px_40px_rgba(108,92,231,0.4)] hover:opacity-90 transition"
        >
          Continue
        </button>
      </div>
      {chatPanel}
    </div>
  );
}
  
  // STEP 2: WAITING SCREEN
  if (!poll) {
    return (
      <>
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-4">
        <div className="mb-8 inline-flex items-center justify-center">
          <span className="px-4 py-1 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
            ✦ Intervue Poll
          </span>
        </div>
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6" />
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          Wait for the teacher to ask questions..
        </h2>
      </div>
      {chatPanel}
      </>
    );
  }
  
  // STEP 3: ACTIVE POLL SCREEN
// STEP 3: ACTIVE POLL SCREEN
return (
  <div className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
    <div className="w-full max-w-2xl">
      <div className="mb-4 flex items-center gap-4 text-slate-900">
        <div className="text-lg font-bold">Question 1</div>
        <div className="flex items-center gap-1.5 text-red-500">
          <span>⏱</span>
          <span className="font-bold text-base">
            {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
            {String(remainingSeconds % 60).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Question header */}
        <div className="bg-slate-600 px-6 py-4">
          <h2 className="text-sm font-bold text-white">
            {poll.question}
          </h2>
        </div>

        {/* Options */}
        <div className="bg-white p-4 space-y-3">
          {poll.options.map((option, index) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
            const percentage =
              totalVotes > 0
                ? Math.round((option.votes / totalVotes) * 100)
                : 0;

            const isSelected = selectedOption === index;

            // PRE-VOTE: plain option rows with selected border highlight
            if (!showResults) {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (canVote) setSelectedOption(index);
                  }}
                  disabled={!isPollActive}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left flex items-center gap-3 transition
                    ${isSelected
                      ? "border-indigo-500 bg-white"
                      : "border-slate-200 bg-slate-100"
                    }
                    ${isPollActive ? "hover:bg-slate-50 cursor-pointer" : "cursor-not-allowed"}
                  `}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0
                    ${isSelected ? "bg-indigo-500 text-white" : "bg-slate-400 text-white"}`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {option.text}
                  </span>
                </button>
              );
            }

            // POST-VOTE: bar fill style
            return (
              <button
                key={index}
                type="button"
                disabled
                className={`relative w-full rounded-xl border overflow-hidden text-left transition
                  ${isSelected ? "border-indigo-400" : "border-slate-200"}
                `}
                style={{ height: "56px" }}
              >
                <div className="absolute inset-0 bg-slate-100" />
                <div
                  className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative z-10 flex items-center justify-between h-full px-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0
                      ${percentage > 15 ? "bg-white/30 border border-white/40 text-white" : "bg-slate-400 text-white"}`}>
                      {index + 1}
                    </span>
                    <span className={`text-sm font-semibold ${percentage > 30 ? "text-white" : "text-slate-800"}`}>
                      {option.text}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 bg-white/80 px-2 py-0.5 rounded-md">
                    {percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button — shown before voting and before timeout */}
      {!showResults && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              if (selectedOption !== null) handleVote(selectedOption);
            }}
            disabled={selectedOption === null || !canVote}
            className="px-10 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_12px_30px_rgba(108,92,231,0.4)] hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}

      {hasVoted && (
        <p className="mt-8 text-center text-sm font-bold text-slate-900">
          Wait for the teacher to ask a new question..
        </p>
      )}
    </div>
    {chatPanel}
  </div>
);
}

