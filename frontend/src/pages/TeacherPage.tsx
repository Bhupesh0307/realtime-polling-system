import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { usePollTimer } from "../hooks/usePollTimer";
import { TeacherCreatePollView } from "../components/TeacherCreatePollView";
import { TeacherLivePollView } from "../components/TeacherLivePollView";
import { PollHistoryView, type HistoryPollItem } from "../components/PollHistoryView";
import { ChatPanel } from "../components/ChatPanel";

const TEACHER_LABEL = "Teacher";
const HISTORY_API = "https://realtime-polling-system-731v.onrender.com/api/polls/history";

export default function TeacherPage() {
  const [viewMode, setViewMode] = useState<"create" | "live" | "history">("create");
  const [pollHistory, setPollHistory] = useState<HistoryPollItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "participants">("chat");
  const [chatInput, setChatInput] = useState("");

  const socket = useSocket({ role: "teacher" });
  const { pollState, error, students, messages, createPoll, kickStudent, sendChat } = socket;
  const remainingSeconds = usePollTimer(pollState?.remainingTimeMs);

  const poll = pollState?.poll ?? null;
  const hasActivePoll = !!poll && remainingSeconds > 0;

  useEffect(() => {
    if (viewMode !== "history") return;
    setHistoryLoading(true);
    setHistoryError(null);
    fetch(HISTORY_API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then((data: HistoryPollItem[]) => setPollHistory(data))
      .catch((err) => {
        setHistoryError(err instanceof Error ? err.message : "Failed to fetch poll history");
      })
      .finally(() => setHistoryLoading(false));
  }, [viewMode]);

  const handleCreatePoll = (question: string, options: string[], durationSeconds: number) => {
    createPoll(question, options, durationSeconds * 1000);
  };

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendChat(TEACHER_LABEL, msg);
    setChatInput("");
  };

  const chatSlot = (
    <ChatPanel
      messages={messages}
      participants={students}
      inputValue={chatInput}
      onInputChange={setChatInput}
      onSend={handleSendChat}
      tab={chatTab}
      onTabChange={setChatTab}
      isOpen={chatOpen}
      onToggleOpen={() => setChatOpen((o) => !o)}
      currentUserName={TEACHER_LABEL}
      onKickParticipant={kickStudent}
    />
  );

  if (viewMode === "history") {
    return (
      <>
        <PollHistoryView
          polls={pollHistory}
          loading={historyLoading}
          error={historyError ?? error}
          onBack={() => setViewMode(hasActivePoll ? "live" : "create")}
        />
        {chatSlot}
      </>
    );
  }

  if (hasActivePoll && poll) {
    return (
      <>
        <TeacherLivePollView
          question={poll.question}
          options={poll.options}
          remainingSeconds={remainingSeconds}
          error={error}
          onViewHistory={() => setViewMode("history")}
        />
        {chatSlot}
      </>
    );
  }

  return (
    <>
      <TeacherCreatePollView
        onSubmit={handleCreatePoll}
        error={error}
        onViewHistory={() => setViewMode("history")}
      />
      {chatSlot}
    </>
  );
}
