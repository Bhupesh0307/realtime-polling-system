export function StudentRemovedView() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex items-center justify-center">
          <span className="px-4 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
            ✦ Intervue Poll
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
          You were removed by the teacher.
        </h1>
        <p className="text-sm text-slate-500">
          You can no longer participate in this poll session.
        </p>
      </div>
    </div>
  );
}
