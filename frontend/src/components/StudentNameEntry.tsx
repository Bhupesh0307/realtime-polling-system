import type { ChangeEvent } from "react";

interface StudentNameEntryProps {
  name: string;
  onNameChange: (value: string) => void;
  onContinue: () => void;
  chatSlot: React.ReactNode;
  error?: string | null;
}

export function StudentNameEntry({
  name,
  onNameChange,
  onContinue,
  chatSlot,
  error,
}: StudentNameEntryProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
  };

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

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 w-full max-w-md mx-auto text-left">
            {error}
          </div>
        )}
        <p className="text-sm leading-relaxed text-slate-500 mb-10 max-w-md mx-auto">
          If you're a student, you'll be able to{" "}
          <strong className="text-slate-700 font-semibold">submit your answers</strong>, participate
          in live polls, and see how your responses compare with your classmates
        </p>

        <div className="text-left mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Enter your Name</label>
          <input
            type="text"
            placeholder="Rahul Bajaj"
            value={name}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <button
          onClick={onContinue}
          className="px-14 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_18px_40px_rgba(108,92,231,0.4)] hover:opacity-90 transition"
        >
          Continue
        </button>
      </div>
      {chatSlot}
    </div>
  );
}
