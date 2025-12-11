import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const baseClasses =
    'rounded-full px-4 py-2 text-sm sm:text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-300';

  const variantClasses = {
    primary: 'gradient-button text-white shadow-md hover:shadow-lg',
    secondary: 'secondary-button text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}







