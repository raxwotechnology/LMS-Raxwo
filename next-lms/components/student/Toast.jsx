'use client';

import React from 'react';
import { useStudent } from '@/context/StudentContext';

export default function Toast() {
  const { toast } = useStudent();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-brand-success text-white border-brand-success',
    info: 'bg-brand-navy text-white border-brand-navy dark:bg-brand-darkSoft dark:border-brand-focus',
    warning: 'bg-brand-warning text-white border-brand-warning',
    error: 'bg-brand-error text-white border-brand-error',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slideUp pointer-events-none select-none"
    >
      <div
        className={`flex items-center gap-3 p-4 rounded-xl shadow-xl border text-sm font-medium ${
          bgColors[toast.type] || bgColors.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="flex-1 leading-snug">{toast.message}</p>
      </div>
    </div>
  );
}
