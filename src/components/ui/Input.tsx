import React, { memo } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  footer?: React.ReactNode;
}

export const Input = memo(function Input({ label, error, footer, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {footer && <div className="mt-1">{footer}</div>}
    </div>
  );
});
