type RoleCardProps = {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export function RoleCard({ title, description, selected, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-start rounded-2xl border bg-white px-6 py-5 text-left transition-shadow",
        "w-full max-w-xs",
        selected
          ? "border-primary shadow-[0_18px_40px_rgba(108,92,231,0.35)]"
          : "border-card-border hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]",
      ].join(" ")}
    >
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </button>
  );
}

