export function EmptyState({ icon, title, hint }: {
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center ani-show">
      <div className="w-16 h-16 rounded-full c-primary-glass flex items-center justify-center mb-4">
        <i className={`${icon} text-2xl c-primary`} />
      </div>
      <p className="text-base font-medium t-primary">{title}</p>
      {hint && <p className="text-sm t-secondary mt-1">{hint}</p>}
    </div>
  );
}
