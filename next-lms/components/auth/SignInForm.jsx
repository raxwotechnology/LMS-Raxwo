'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from './PasswordInput';

export default function SignInForm() {
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  // Field refs for auto-focusing first invalid input
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  // Clear specific field error on change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Please enter your student email or student ID.';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    }

    setErrors(newErrors);

    // Focus first invalid field
    if (newErrors.identifier && identifierRef.current) {
      identifierRef.current.focus();
    } else if (newErrors.password && passwordRef.current) {
      passwordRef.current.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Unable to sign in. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Success
      if (typeof window !== 'undefined') {
        localStorage.setItem('student', JSON.stringify(data.user));
      }

      setIsSuccess(true);
      setSuccessUser(data.user);
      setIsSubmitting(false);

      // Auto-navigate to dashboard after brief confirmation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err) {
      console.error('Sign-in error:', err);
      setServerError('A network error occurred. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  // Render Success Confirmation Screen
  if (isSuccess) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center text-center py-8 animate-fadeIn"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-full bg-brand-success/15 text-brand-success flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-9 h-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brand-text dark:text-brand-darkText mb-2">
          You are signed in
        </h2>
        <p className="text-sm text-brand-muted dark:text-brand-darkText/70 max-w-xs mb-6">
          Welcome back, <span className="font-semibold text-brand-text dark:text-brand-darkText">{successUser?.name || 'Student'}</span>. Redirecting to your dashboard...
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white font-semibold text-sm transition-colors duration-150"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div id="auth-panel" role="tabpanel" aria-label="Sign in to your account">
      {/* Headings */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-text dark:text-brand-darkText tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-brand-muted dark:text-brand-darkText/70 mt-1">
          Sign in to your student account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Identifier Field */}
        <div>
          <label
            htmlFor="signin-identifier"
            className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
          >
            Email or Student ID
          </label>
          <input
            ref={identifierRef}
            type="text"
            id="signin-identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            autoComplete="username"
            placeholder="e.g. student@wisdom.lk or ST1024"
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? 'signin-identifier-error' : undefined}
            className={`w-full rounded-[10px] border-[1.5px] py-3 px-3.5 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 transition-all duration-150 outline-none ${
              errors.identifier
                ? 'border-brand-error focus:border-brand-error focus:ring-4 focus:ring-brand-error/20'
                : 'border-brand-border dark:border-brand-darkBorder focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20'
            }`}
          />
          {errors.identifier && (
            <p
              id="signin-identifier-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-brand-text dark:text-brand-darkText"
            >
              Password
            </label>
            <Link
              href="#"
              className="text-xs text-brand-focus hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            ref={passwordRef}
            id="signin-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            hasError={!!errors.password}
            aria-describedby={errors.password ? 'signin-password-error' : undefined}
          />
          {errors.password && (
            <p
              id="signin-password-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Keep Me Signed In */}
        <div className="flex items-center pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-brand-text dark:text-brand-darkText">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-brand-border dark:border-brand-darkBorder text-brand-navy focus:ring-brand-focus cursor-pointer"
            />
            <span>Keep me signed in</span>
          </label>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            role="alert"
            className="p-3 rounded-[10px] bg-brand-error/10 border border-brand-error/25 text-brand-error text-xs font-medium flex items-start gap-2 animate-fadeIn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        {/* Full-width Navy Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover disabled:opacity-70 text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-focus/30 active:scale-[0.99] motion-reduce:active:scale-100 mt-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>

        {/* Link to Register */}
        <div className="text-center pt-3">
          <p className="text-xs text-brand-muted dark:text-brand-darkText/70">
            New student?{' '}
            <Link
              href="/register"
              className="font-semibold text-brand-navy dark:text-white hover:underline ml-0.5"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
