'use client';

import { useState, forwardRef } from 'react';

const PasswordInput = forwardRef(function PasswordInput(
  {
    id,
    name,
    value,
    onChange,
    onBlur,
    placeholder = '••••••••',
    hasError = false,
    autoComplete = 'current-password',
    'aria-describedby': ariaDescribedBy,
    required = false,
    className = '',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        className={`w-full rounded-[10px] border-[1.5px] py-3 pl-3.5 pr-11 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 transition-all duration-150 outline-none ${
          hasError
            ? 'border-brand-error focus:border-brand-error focus:ring-4 focus:ring-brand-error/20'
            : 'border-brand-border dark:border-brand-darkBorder focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20'
        } ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-text dark:text-brand-darkText/70 dark:hover:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-focus/30 rounded"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        tabIndex={0}
      >
        {showPassword ? (
          // Eye off icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          // Eye on icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
});

export default PasswordInput;
