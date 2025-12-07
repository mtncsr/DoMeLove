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
    notStarted: 'bg-gray-300',
    inProgress: 'bg-orange-400',
    complete: 'bg-green-500',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`w-4 h-4 rounded-full ${statusColors[status]}`} />
      <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}



