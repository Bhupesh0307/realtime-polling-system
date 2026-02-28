interface PollOption {
  text: string;
  votes: number;
}

interface TeacherLivePollViewProps {
  question: string;
  options: PollOption[];
  remainingSeconds: number;
  error: string | null;
  onViewHistory: () => void;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

export function TeacherLivePollView({
  question,
  options,
  remainingSeconds,
  error,
  onViewHistory,
}: TeacherLivePollViewProps) {
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
            ✦ Intervue Poll
          </span>
          <button
            type="button"
            onClick={onViewHistory}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            View Poll History
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center gap-4">
          <div className="text-lg font-bold text-slate-900">Question 1</div>
          <div className="flex items-center gap-1.5 text-red-500">
            <span>⏱</span>
            <span className="font-bold text-base">
              {padTwo(Math.floor(remainingSeconds / 60))}:{padTwo(remainingSeconds % 60)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-600 px-6 py-4">
            <h2 className="text-sm font-bold text-white">{question}</h2>
          </div>
          <div className="bg-white p-4 space-y-3">
            {options.map((option, index) => {
              const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              return (
                <div
                  key={index}
                  className="relative w-full rounded-xl border border-slate-200 overflow-hidden"
                  style={{ height: "56px" }}
                >
                  <div className="absolute inset-0 bg-slate-100" />
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between h-full px-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          pct > 15
                            ? "bg-white/30 border border-white/40 text-white"
                            : "bg-slate-400 text-white"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          pct > 30 ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {option.text}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 bg-white/80 px-2 py-0.5 rounded-md">
                      {pct}% · {option.votes} votes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
