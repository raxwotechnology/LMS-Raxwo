import React from 'react';
import { useStudent } from '../../context/StudentContext';

export default function Toast() {
  const { toast } = useStudent();

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-brand-success text-white border-brand-success';
      case 'warning':
        return 'bg-brand-warning text-white border-brand-warning';
      case 'error':
        return 'bg-brand-error text-white border-brand-error';
      default:
        return 'bg-brand-navy text-white border-brand-navy';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md pointer-events-none"
    >
      <div className={`p-1 rounded-full ${getStyle()}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="text-brand-text bg-white px-3 py-1.5 rounded-lg shadow-sm border border-brand-border">
        {toast.message}
      </span>
    </div>
  );
}
