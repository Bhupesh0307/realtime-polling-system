import React, { useEffect, useRef, useState } from "react";
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

interface OptionEntry {
  text: string;
  isCorrect: boolean | null;
}

interface HistoryPollOption {
  text: string;
  votes: number;
}

interface HistoryPoll {
  _id: string;
  question: string;
  options: HistoryPollOption[];
  createdAt: string;
  duration?: number;
}

interface StudentSummary {
  socketId: string;
  name: string;
}

export default function TeacherPage() {
  const [question, setQuestion] = useState<string>("");
  const [optionEntries, setOptionEntries] = useState<OptionEntry[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ]);
  const [duration, setDuration] = useState<number>(60);
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"create" | "live" | "history">("create");
  const [pollHistory, setPollHistory] = useState<HistoryPoll[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedPollId, setExpandedPollId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);

  // Chat state
  const [messages, setMessages] = useState<{ sender: string; message: string; timestamp: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "participants">("chat");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const DURATION_OPTIONS = [30, 45, 60];
  const TEACHER_NAME = "Teacher";

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handlePollState = (state: PollState) => setPollState(state);
    const handleErrorMessage = (message: string) => {
      setError(message);
      window.setTimeout(() => setError((c) => (c === message ? null : c)), 5000);
    };
    const handleStudentListUpdate = (list: StudentSummary[]) => setStudents(list);
    const handleChatMessage = (msg: { sender: string; message: string; timestamp: number }) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("poll_state", handlePollState);
    socket.on("error_message", handleErrorMessage);
    socket.on("student_list_update", handleStudentListUpdate);
    socket.on("chat_message", handleChatMessage);
    socket.emit("register_teacher");
    socket.emit("get_active_poll");
    socket.emit("get_student_list");

    return () => {
      socket.off("poll_state", handlePollState);
      socket.off("error_message", handleErrorMessage);
      socket.off("student_list_update", handleStudentListUpdate);
      socket.off("chat_message", handleChatMessage);
    };
  }, []);

  useEffect(() => {
    if (!pollState || typeof pollState.remainingTimeMs !== "number") {
      setRemainingSeconds(0);
      return;
    }
    const initialSeconds = Math.floor(pollState.remainingTimeMs / 1000);
    setRemainingSeconds(initialSeconds);
    if (initialSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) { window.clearInterval(intervalId); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [pollState?.remainingTimeMs]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleOptionTextChange = (index: number, value: string) => {
    const next = [...optionEntries];
    next[index] = { ...next[index], text: value };
    setOptionEntries(next);
  };

  const handleCorrectChange = (index: number, isCorrect: boolean) => {
    const next = [...optionEntries];
    next[index] = { ...next[index], isCorrect };
    setOptionEntries(next);
  };

  const handleAddOption = () => {
    setOptionEntries([...optionEntries, { text: "", isCorrect: false }]);
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = optionEntries.map((o) => o.text.trim());
    if (!trimmedQuestion) return;
    if (trimmedOptions.some((o) => !o)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    socket.emit("create_poll", {
      question: trimmedQuestion,
      options: trimmedOptions,
      duration: duration * 1000,
    });
  };

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    socket.emit("chat_message", { sender: TEACHER_NAME, message: trimmed });
    setChatInput("");
  };

  const handleKickOut = (studentSocketId: string) => {
    socket.emit("remove_student", { studentSocketId });
  };

  const poll = pollState?.poll ?? null;
  const hasActivePoll = !!poll && remainingSeconds > 0;

  useEffect(() => {
    if (viewMode !== "history") return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch("https://realtime-polling-system-731v.onrender.com/api/polls/history");
        if (!res.ok) throw new Error("Failed to fetch poll history");
        const data: HistoryPoll[] = await res.json();
        setPollHistory(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch poll history");
      } finally {
        setLoadingHistory(false);
      }
    };

    void fetchHistory();
  }, [viewMode]);

  // Shared chat panel — same floating UI as student, but participants tab has "Kick out" action
  const chatPanel = (
    <>
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center text-white text-xl"
      >
        💬
      </button>

      {isChatOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-80 max-w-full rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Tabs */}
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
                  const isSelf = m.sender === TEACHER_NAME;
                  return (
                    <div key={idx} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
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
                    if (e.key === "Enter") { e.preventDefault(); handleSendChat(); }
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
            // Participants tab — matches the PNG design with Name + Action columns
            <div className="h-72 flex flex-col">
              <div className="grid grid-cols-[1fr_auto] px-4 py-2 border-b border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Name</span>
                <span className="text-[11px] font-semibold text-slate-500">Action</span>
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
                    className="grid grid-cols-[1fr_auto] items-center px-4 py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => handleKickOut(s.socketId)}
                      className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition"
                    >
                      Kick out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  // ─── HISTORY VIEW ───────────────────────────────────────────────────────────
  if (viewMode === "history") {
    return (
      <>
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                ✦ Intervue Poll
              </span>
              <button
                type="button"
                onClick={() => setViewMode(hasActivePoll ? "live" : "create")}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                Back
              </button>
            </div>

            <h1 className="mb-4 text-2xl font-semibold text-slate-900">
              View <span className="font-bold">Poll History</span>
            </h1>

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {loadingHistory && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">Loading history...</div>
            )}
            {!loadingHistory && pollHistory.length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 px-5 py-6 text-sm text-slate-500 text-center shadow-sm">
                No poll history yet.
              </div>
            )}

            <div className="space-y-5">
              {pollHistory.map((historyPoll, index) => {
                const totalVotes = historyPoll.options.reduce((sum, o) => sum + o.votes, 0);
                const created = new Date(historyPoll.createdAt).toLocaleString();
                const isExpanded = expandedPollId === historyPoll._id;

                return (
                  <div
                    key={historyPoll._id}
                    className="rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer"
                    onClick={() =>
                      setExpandedPollId((prev) => (prev === historyPoll._id ? null : historyPoll._id))
                    }
                  >
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Question {index + 1}</p>
                        <p className="text-sm font-semibold text-slate-900">{historyPoll.question}</p>
                        <p className="mt-1 text-xs text-slate-500">{created}</p>
                      </div>
                      <div className="text-right text-xs text-slate-600">
                        <div className="font-semibold">{totalVotes} votes</div>
                        {typeof historyPoll.duration === "number" && (
                          <div>{Math.round(historyPoll.duration / 1000)}s</div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-2">
                        {historyPoll.options.map((opt, optIndex) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          return (
                            <div key={optIndex} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                                    {optIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium text-slate-900">{opt.text}</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-900">{pct}% · {opt.votes} votes</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {chatPanel}
      </>
    );
  }

  // ─── LIVE POLL VIEW ──────────────────────────────────────────────────────────
  if (hasActivePoll && poll) {
    return (
      <>
        <div className="min-h-screen bg-white px-8 py-10">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                ✦ Intervue Poll
              </span>
              <button
                type="button"
                onClick={() => setViewMode("history")}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View Poll History
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mb-4 flex items-center gap-4">
              <div className="text-lg font-bold text-slate-900">Question 1</div>
              <div className="flex items-center gap-1.5 text-red-500">
                <span>⏱</span>
                <span className="font-bold text-base">
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                  {String(remainingSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-600 px-6 py-4">
                <h2 className="text-sm font-bold text-white">{poll.question}</h2>
              </div>
              <div className="bg-white p-4 space-y-3">
                {poll.options.map((option, index) => {
                  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  return (
                    <div
                      key={index}
                      className="relative w-full rounded-xl border border-slate-200 overflow-hidden"
                      style={{ height: "56px" }}
                    >
                      <div className="absolute inset-0 bg-slate-100" />
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between h-full px-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${percentage > 15 ? "bg-white/30 border border-white/40 text-white" : "bg-slate-400 text-white"}`}>
                            {index + 1}
                          </span>
                          <span className={`text-sm font-semibold ${percentage > 30 ? "text-white" : "text-slate-800"}`}>
                            {option.text}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 bg-white/80 px-2 py-0.5 rounded-md">
                          {percentage}% · {option.votes} votes
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {chatPanel}
      </>
    );
  }

  // ─── CREATE POLL VIEW ────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 px-8 py-10 max-w-4xl w-full">
          <div className="mb-2 flex items-center justify-between">
            <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
              ✦ Intervue Poll
            </span>
            <button
              type="button"
              onClick={() => setViewMode("history")}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              View Poll History
            </button>
          </div>

          <h1 className="text-4xl font-light text-slate-900 mt-4 mb-2">
            Let's <span className="font-bold">Get Started</span>
          </h1>
          <p className="text-sm text-slate-400 mb-8 max-w-lg">
            you'll have the ability to create and manage polls, ask questions, and monitor
            your students' responses in real-time.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-bold text-slate-900">Enter your question</label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="appearance-none border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-800 bg-white focus:outline-none cursor-pointer"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} seconds</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs">▼</span>
            </div>
          </div>

          <div className="relative mb-8">
            <textarea
              value={question}
              onChange={(e) => { if (e.target.value.length <= 100) setQuestion(e.target.value); }}
              rows={4}
              placeholder=""
              className="w-full rounded-xl bg-slate-100 px-4 py-4 text-sm text-slate-900 resize-none focus:outline-none"
            />
            <span className="absolute bottom-3 right-4 text-xs text-slate-400">{question.length}/100</span>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex-1">
              <p className="text-base font-bold text-slate-900 mb-4">Edit Options</p>
              <div className="space-y-3">
                {optionEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={entry.text}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-4 px-5 py-2 rounded-lg border border-indigo-400 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
              >
                + Add More option
              </button>
            </div>

            <div className="w-56">
              <p className="text-base font-bold text-slate-900 mb-4">Is it Correct?</p>
              <div className="space-y-3">
                {optionEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-4" style={{ height: "42px" }}>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span
                        onClick={() => handleCorrectChange(index, true)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${entry.isCorrect === true ? "border-indigo-500" : "border-slate-300"}`}
                      >
                        {entry.isCorrect === true && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />}
                      </span>
                      <span className="text-sm text-slate-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span
                        onClick={() => handleCorrectChange(index, false)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${entry.isCorrect === false ? "border-indigo-500" : "border-slate-300"}`}
                      >
                        {entry.isCorrect === false && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />}
                      </span>
                      <span className="text-sm text-slate-700">No</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-10 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_12px_30px_rgba(108,92,231,0.4)] hover:opacity-90 transition"
          >
            Ask Question
          </button>
        </div>
      </div>
      {chatPanel}
    </>
  );
}