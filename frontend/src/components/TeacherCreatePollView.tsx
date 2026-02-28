import { useState } from "react";

interface OptionRow {
  text: string;
  isCorrect: boolean | null;
}

interface TeacherCreatePollViewProps {
  onSubmit: (question: string, options: string[], durationSeconds: number) => void;
  error: string | null;
  onViewHistory: () => void;
}

const DURATION_CHOICES = [30, 45, 60];
const MAX_QUESTION_LENGTH = 100;

export function TeacherCreatePollView({
  onSubmit,
  error,
  onViewHistory,
}: TeacherCreatePollViewProps) {
  const [question, setQuestion] = useState("");
  const [optionRows, setOptionRows] = useState<OptionRow[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ]);
  const [duration, setDuration] = useState(60);

  const updateOptionText = (index: number, value: string) => {
    const next = [...optionRows];
    next[index] = { ...next[index], text: value };
    setOptionRows(next);
  };

  const updateOptionCorrect = (index: number, isCorrect: boolean) => {
    const next = [...optionRows];
    next[index] = { ...next[index], isCorrect };
    setOptionRows(next);
  };

  const addOption = () => {
    setOptionRows([...optionRows, { text: "", isCorrect: false }]);
  };

  const handleSubmit = () => {
    const q = question.trim();
    const opts = optionRows.map((r) => r.text.trim());
    if (!q) return;
    if (opts.some((o) => !o)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;
    onSubmit(q, opts, duration);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-8 py-10 max-w-4xl w-full">
        <div className="mb-2 flex items-center justify-between">
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

        <h1 className="text-4xl font-light text-slate-900 mt-4 mb-2">
          Let's <span className="font-bold">Get Started</span>
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-lg">
          you'll have the ability to create and manage polls, ask questions, and monitor
          your students' responses in real-time.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <label className="text-base font-bold text-slate-900">Enter your question</label>
          <div className="relative">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="appearance-none border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-800 bg-white focus:outline-none cursor-pointer"
            >
              {DURATION_CHOICES.map((d) => (
                <option key={d} value={d}>
                  {d} seconds
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs">
              ▼
            </span>
          </div>
        </div>

        <div className="relative mb-8">
          <textarea
            value={question}
            onChange={(e) => {
              if (e.target.value.length <= MAX_QUESTION_LENGTH) setQuestion(e.target.value);
            }}
            rows={4}
            placeholder=""
            className="w-full rounded-xl bg-slate-100 px-4 py-4 text-sm text-slate-900 resize-none focus:outline-none"
          />
          <span className="absolute bottom-3 right-4 text-xs text-slate-400">
            {question.length}/{MAX_QUESTION_LENGTH}
          </span>
        </div>

        <div className="flex gap-6 mb-6">
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900 mb-4">Edit Options</p>
            <div className="space-y-3">
              {optionRows.map((entry, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={entry.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-4 px-5 py-2 rounded-lg border border-indigo-400 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
            >
              + Add More option
            </button>
          </div>

          <div className="w-56">
            <p className="text-base font-bold text-slate-900 mb-4">Is it Correct?</p>
            <div className="space-y-3">
              {optionRows.map((entry, index) => (
                <div key={index} className="flex items-center gap-4" style={{ height: "42px" }}>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span
                      onClick={() => updateOptionCorrect(index, true)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                        entry.isCorrect === true ? "border-indigo-500" : "border-slate-300"
                      }`}
                    >
                      {entry.isCorrect === true && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />
                      )}
                    </span>
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span
                      onClick={() => updateOptionCorrect(index, false)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                        entry.isCorrect === false ? "border-indigo-500" : "border-slate-300"
                      }`}
                    >
                      {entry.isCorrect === false && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />
                      )}
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
  );
}
