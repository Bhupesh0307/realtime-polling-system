interface StudentWaitingViewProps {
  chatSlot: React.ReactNode;
  error?: string | null;
}

export function StudentWaitingView({ chatSlot, error }: StudentWaitingViewProps) {
  return (
    <>
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 max-w-md w-full">
            {error}
          </div>
        )}
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
      {chatSlot}
    </>
  );
}
