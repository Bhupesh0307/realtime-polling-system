import { useState } from "react";

interface HistoryOption {
  text: string;
  votes: number;
}

export interface HistoryPollItem {
  _id: string;
  question: string;
  options: HistoryOption[];
  createdAt: string;
  duration?: number;
}

interface PollHistoryViewProps {
  polls: HistoryPollItem[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export function PollHistoryView({
  polls,
  loading,
  error,
  onBack,
}: PollHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
            ✦ Intervue Poll
          </span>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Back
          </button>
        </div>

        <h1 className="mb-4 text-2xl font-semibold text-slate-900">
          View <span className="font-bold">Poll History</span>
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            Loading history...
          </div>
        )}
        {!loading && polls.length === 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 px-5 py-6 text-sm text-slate-500 text-center shadow-sm">
            No poll history yet.
          </div>
        )}

        <div className="space-y-5">
          {polls.map((historyPoll, index) => {
            const totalVotes = historyPoll.options.reduce((sum, o) => sum + o.votes, 0);
            const created = new Date(historyPoll.createdAt).toLocaleString();
            const isExpanded = expandedId === historyPoll._id;

            return (
              <div
                key={historyPoll._id}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer"
                onClick={() =>
                  setExpandedId((prev) => (prev === historyPoll._id ? null : historyPoll._id))
                }
              >
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Question {index + 1}
                    </p>
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
                      const pct =
                        totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      return (
                        <div
                          key={optIndex}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                                {optIndex + 1}
                              </span>
                              <span className="text-sm font-medium text-slate-900">{opt.text}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-900">
                              {pct}% · {opt.votes} votes
                            </span>
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
  );
}
