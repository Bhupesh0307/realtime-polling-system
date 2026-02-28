import { useState, useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { usePollTimer } from "../hooks/usePollTimer";
import { StudentNameEntry } from "../components/StudentNameEntry";
import { StudentWaitingView } from "../components/StudentWaitingView";
import { StudentActivePollView } from "../components/StudentActivePollView";
import { StudentRemovedView } from "../components/StudentRemovedView";
import { ChatPanel } from "../components/ChatPanel";

const STORAGE_NAME_KEY = "student_name";
const STORAGE_VOTED_POLL_KEY = "voted_poll_id";

function getStoredName(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_NAME_KEY);
  } catch {
    return null;
  }
}

export default function StudentPage() {
  const [initialName] = useState(getStoredName);
  const [hasEnteredName, setHasEnteredName] = useState(() => !!initialName?.trim());
  const [studentName, setStudentName] = useState(initialName ?? "");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "participants">("chat");
  const [chatInput, setChatInput] = useState("");
  const prevPollIdRef = useRef<string | null>(null);

  const socket = useSocket({
    role: "student",
    initialStudentName: initialName,
  });
  const {
    pollState,
    error,
    students,
    messages,
    removedByTeacher,
    registerStudent,
    submitVote,
    sendChat,
  } = socket;

  const remainingSeconds = usePollTimer(pollState?.remainingTimeMs);
  const poll = pollState?.poll ?? null;
  const isPollActive = !!poll && remainingSeconds > 0;
  const canVote = isPollActive && studentName.trim().length > 0 && !hasVoted;
  const showResults = hasVoted || !isPollActive;

  useEffect(() => {
    const pollId = poll?._id ?? null;
    const storedVotedId = sessionStorage.getItem(STORAGE_VOTED_POLL_KEY);

    if (pollId) {
      if (storedVotedId === pollId) {
        setHasVoted(true);
      } else if (prevPollIdRef.current && prevPollIdRef.current !== pollId) {
        sessionStorage.removeItem(STORAGE_VOTED_POLL_KEY);
        setHasVoted(false);
        setSelectedOption(null);
      }
    }
    prevPollIdRef.current = pollId;
  }, [poll?._id]);

  const handleContinue = () => {
    const name = studentName.trim();
    if (!name) return;
    sessionStorage.setItem(STORAGE_NAME_KEY, name);
    registerStudent(name);
    setHasEnteredName(true);
  };

  const handleVote = (index: number) => {
    if (hasVoted) return;
    setSelectedOption(index);
    if (!canVote || !poll) return;
    setHasVoted(true);
    sessionStorage.setItem(STORAGE_VOTED_POLL_KEY, poll._id ?? "");
    submitVote(poll._id ?? "", studentName.trim(), index);
  };

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendChat(studentName.trim() || "Student", msg);
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
      currentUserName={studentName.trim() || "Student"}
    />
  );

  if (removedByTeacher) {
    return <StudentRemovedView />;
  }

  if (!hasEnteredName) {
    return (
      <StudentNameEntry
        name={studentName}
        onNameChange={setStudentName}
        onContinue={handleContinue}
        chatSlot={chatSlot}
        error={error}
      />
    );
  }

  if (!poll) {
    return <StudentWaitingView chatSlot={chatSlot} error={error} />;
  }

  return (
    <StudentActivePollView
      question={poll.question}
      options={poll.options}
      remainingSeconds={remainingSeconds}
      selectedIndex={selectedOption}
      canVote={canVote}
      showResults={showResults}
      hasVoted={hasVoted}
      onSelectOption={setSelectedOption}
      onSubmitVote={() => selectedOption !== null && handleVote(selectedOption)}
      chatSlot={chatSlot}
      error={error}
    />
  );
}
