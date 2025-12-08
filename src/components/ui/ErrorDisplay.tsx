import React from 'react';

interface ErrorDisplayProps {
  errors: Array<{ field: string; message: string; section?: string }>;
  onDismiss?: () => void;
}

export function ErrorDisplay({ errors, onDismiss }: ErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold mb-2">Validation Errors</h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">
                {error.message}
                {error.section && (
                  <span className="text-red-600 ml-2">({error.section})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 ml-4"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}




