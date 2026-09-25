import React from 'react';

export default function ProgressBar({ progress = 0, showLabel = true, size = 'md' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const isComplete = clamped === 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="text-brand-muted dark:text-brand-darkText/70">Progress</span>
          <span className={isComplete ? 'text-brand-success font-bold' : 'text-brand-text dark:text-brand-darkText'}>
            {clamped}% {isComplete && '✓ Completed'}
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Course progress: ${clamped}%`}
        className={`w-full bg-brand-border/60 dark:bg-brand-darkBorder rounded-full overflow-hidden ${heights[size] || heights.md}`}
      >
        <div
          style={{ width: `${clamped}%` }}
          className={`h-full rounded-full transition-all duration-300 ease-out motion-reduce:transition-none ${
            isComplete
              ? 'bg-brand-success'
              : 'bg-brand-navy dark:bg-brand-focus'
          }`}
        />
      </div>
    </div>
  );
}
