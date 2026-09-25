import React from 'react';

export default function ProgressBar({ progress = 0, label, showPercentage = true, size = 'md' }) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          {label && (
            <span className="font-medium text-brand-muted">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="font-semibold text-brand-text ml-auto">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Course Progress'}
        className={`w-full bg-brand-border/60 rounded-full overflow-hidden ${heightClasses[size] || heightClasses.md}`}
      >
        <div
          style={{ width: `${clampedProgress}%` }}
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            clampedProgress === 100
              ? 'bg-brand-success'
              : 'bg-brand-accent'
          }`}
        />
      </div>
    </div>
  );
}
