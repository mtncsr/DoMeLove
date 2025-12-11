import React from 'react';
import type { StepStatus } from '../../contexts/EditorContext';

interface StepIndicatorProps {
  step: string;
  status: StepStatus;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

export function StepIndicator({ step, status, isActive, onClick, label }: StepIndicatorProps) {
  const statusColors = {
    notStarted: 'bg-slate-300',
    inProgress: 'bg-amber-400',
    complete: 'bg-emerald-500',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        isActive
          ? 'bg-white border-fuchsia-200 shadow-md'
          : 'bg-white/70 border-slate-200 hover:border-fuchsia-200 hover:shadow-sm'
      }`}
    >
      <div className={`w-4 h-4 rounded-full ${statusColors[status]} shadow-inner`} />
      <span className={`font-semibold ${isActive ? 'text-fuchsia-700' : 'text-slate-700'}`}>
        {label}
      </span>
    </button>
  );
}







