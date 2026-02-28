interface PollOption {
  text: string;
  votes: number;
}

interface StudentActivePollViewProps {
  question: string;
  options: PollOption[];
  remainingSeconds: number;
  selectedIndex: number | null;
  canVote: boolean;
  showResults: boolean;
  hasVoted: boolean;
  onSelectOption: (index: number) => void;
  onSubmitVote: () => void;
  chatSlot: React.ReactNode;
  error?: string | null;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

export function StudentActivePollView({
  question,
  options,
  remainingSeconds,
  selectedIndex,
  canVote,
  showResults,
  hasVoted,
  onSelectOption,
  onSubmitVote,
  chatSlot,
  error,
}: StudentActivePollViewProps) {
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div className="mb-4 flex items-center gap-4 text-slate-900">
          <div className="text-lg font-bold">Question 1</div>
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
              const percentage =
                totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isSelected = selectedIndex === index;

              if (!showResults) {
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (canVote) onSelectOption(index);
                    }}
                    disabled={!canVote}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left flex items-center gap-3 transition
                      ${isSelected ? "border-indigo-500 bg-white" : "border-slate-200 bg-slate-100"}
                      ${canVote ? "hover:bg-slate-50 cursor-pointer" : "cursor-not-allowed"}
                    `}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-slate-400 text-white"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{option.text}</span>
                  </button>
                );
              }

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
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                          percentage > 15
                            ? "bg-white/30 border border-white/40 text-white"
                            : "bg-slate-400 text-white"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          percentage > 30 ? "text-white" : "text-slate-800"
                        }`}
                      >
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

        {!showResults && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={onSubmitVote}
              disabled={selectedIndex === null || !canVote}
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
      {chatSlot}
    </div>
  );
}
