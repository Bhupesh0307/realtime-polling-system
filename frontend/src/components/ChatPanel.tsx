import { useRef, useEffect } from "react";

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export interface Participant {
  socketId: string;
  name: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  participants: Participant[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  tab: "chat" | "participants";
  onTabChange: (tab: "chat" | "participants") => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  currentUserName: string;
  /** When set, participants list shows a kick button per row */
  onKickParticipant?: (socketId: string) => void;
}

export function ChatPanel({
  messages,
  participants,
  inputValue,
  onInputChange,
  onSend,
  tab,
  onTabChange,
  isOpen,
  onToggleOpen,
  currentUserName,
  onKickParticipant,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  return (
    <>
      <button
        type="button"
        onClick={onToggleOpen}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center text-white text-xl"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-80 max-w-full rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => onTabChange("chat")}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === "chat"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-slate-500"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => onTabChange("participants")}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === "participants"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-slate-500"
              }`}
            >
              Participants
            </button>
          </div>

          {tab === "chat" ? (
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-xs">
                {messages.map((m, idx) => {
                  const isSelf = m.sender === currentUserName;
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
                <div ref={scrollRef} />
              </div>
              <div className="border-t border-slate-200 px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={onSend}
                  className="text-xs font-medium text-purple-600"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col">
              <div
                className={`grid px-4 py-2 border-b border-slate-200 ${
                  onKickParticipant ? "grid-cols-[1fr_auto]" : ""
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-500">Name</span>
                {onKickParticipant && (
                  <span className="text-[11px] font-semibold text-slate-500">Action</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {participants.length === 0 && (
                  <div className="px-4 py-4 text-[11px] text-slate-400">
                    No active participants yet.
                  </div>
                )}
                {participants.map((p) => (
                  <div
                    key={p.socketId}
                    className={`items-center px-4 py-2.5 border-b border-slate-100 last:border-0 ${
                      onKickParticipant ? "grid grid-cols-[1fr_auto]" : ""
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-800">{p.name}</span>
                    {onKickParticipant && (
                      <button
                        type="button"
                        onClick={() => onKickParticipant(p.socketId)}
                        className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition"
                      >
                        Kick out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
