import type { StepStatus } from '../../contexts/EditorContext';

interface StepIndicatorProps {
  step: string;
  status: StepStatus;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

export function StepIndicator({ status, isActive, onClick, label }: StepIndicatorProps) {
  const statusColors = {
    notStarted: 'bg-slate-300',
    inProgress: 'bg-amber-400',
    complete: 'bg-emerald-500',
  };

  const activeClasses =
    'bg-white dark:bg-[var(--surface-2)] border-fuchsia-200 dark:border-[rgba(255,255,255,0.18)] shadow-md';
  const idleClasses =
    'bg-white/70 dark:bg-[var(--surface-2)]/80 border-slate-200 dark:border-[rgba(255,255,255,0.12)] hover:border-fuchsia-200 hover:shadow-sm';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        isActive ? activeClasses : idleClasses
      }`}
    >
      <div className={`w-4 h-4 rounded-full ${statusColors[status]} shadow-inner`} />
      <span className={`font-semibold ${isActive ? 'text-fuchsia-700' : 'text-slate-700 dark:text-[var(--text-strong)]'}`}>
        {label}
      </span>
    </button>
  );
}







