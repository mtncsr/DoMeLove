import React, { memo } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = memo(function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
