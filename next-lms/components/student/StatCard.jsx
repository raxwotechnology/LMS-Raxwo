import React from 'react';

export default function StatCard({ label, value, subtext, icon, accent = 'navy' }) {
  const accentClasses = {
    navy: 'bg-brand-navy/10 text-brand-navy dark:bg-brand-navy/30 dark:text-brand-focus',
    success: 'bg-brand-success/10 text-brand-success',
    warning: 'bg-brand-warning/10 text-brand-warning',
    focus: 'bg-brand-focus/10 text-brand-focus',
  };

  return (
    <div className="bg-brand-soft/80 dark:bg-brand-darkSoft/70 border border-brand-border dark:border-brand-darkBorder rounded-[14px] p-4 shadow-sm hover:border-brand-focus/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-brand-muted dark:text-brand-darkText/70 tracking-wide uppercase">
          {label}
        </span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 ${accentClasses[accent] || accentClasses.navy}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold text-brand-text dark:text-brand-darkText tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <p className="text-[11px] text-brand-muted dark:text-brand-darkText/60 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
