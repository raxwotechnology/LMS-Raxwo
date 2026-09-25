'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PasswordInput from './PasswordInput';
import StrengthMeter from './StrengthMeter';

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  // Field refs for auto-focusing first invalid field
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const agreeTermsRef = useRef(null);

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

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Enter your first name.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Enter your last name.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Enter your email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address, like name@example.com.';
    }

    // Password validation: 8+ characters, at least 1 letter and 1 number
    if (!formData.password) {
      newErrors.password = 'Enter a password.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
      newErrors.password = 'Password must include at least one letter and one number.';
    }

    // Confirm password match
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // Terms agreement
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms and Privacy Policy.';
    }

    setErrors(newErrors);

    // Focus first invalid field
    if (newErrors.firstName && firstNameRef.current) {
      firstNameRef.current.focus();
    } else if (newErrors.lastName && lastNameRef.current) {
      lastNameRef.current.focus();
    } else if (newErrors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (newErrors.password && passwordRef.current) {
      passwordRef.current.focus();
    } else if (newErrors.confirmPassword && confirmPasswordRef.current) {
      confirmPasswordRef.current.focus();
    } else if (newErrors.agreeTerms && agreeTermsRef.current) {
      agreeTermsRef.current.focus();
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Registration failed. Please check your information.');
        setIsSubmitting(false);
        return;
      }

      // Successful registration
      setIsSuccess(true);
      setCreatedUser(data.user);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Registration error:', err);
      setServerError('A network error occurred. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  // Confirmation screen upon successful registration
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
          Account created
        </h2>
        <p className="text-sm text-brand-muted dark:text-brand-darkText/70 max-w-xs mb-6">
          Welcome to Wisdom Institute, <span className="font-semibold text-brand-text dark:text-brand-darkText">{createdUser?.name || 'Student'}</span>! Your registration is complete.
        </p>
        <Link
          href="/login"
          className="w-full py-3 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white font-semibold text-sm transition-colors duration-150 block text-center"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  return (
    <div id="auth-panel" role="tabpanel" aria-label="Create your student account">
      {/* Headings */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-text dark:text-brand-darkText tracking-tight">
          Create your account
        </h2>
        <p className="text-sm text-brand-muted dark:text-brand-darkText/70 mt-1">
          Join Wisdom Institute as a student.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* First Name & Last Name (2 columns >= 420px, stacked < 420px) */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="signup-firstName"
              className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
            >
              First name
            </label>
            <input
              ref={firstNameRef}
              type="text"
              id="signup-firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              placeholder="e.g. Kasun"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'signup-firstName-error' : undefined}
              className={`w-full rounded-[10px] border-[1.5px] py-3 px-3.5 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 transition-all duration-150 outline-none ${
                errors.firstName
                  ? 'border-brand-error focus:border-brand-error focus:ring-4 focus:ring-brand-error/20'
                  : 'border-brand-border dark:border-brand-darkBorder focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20'
              }`}
            />
            {errors.firstName && (
              <p
                id="signup-firstName-error"
                className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-lastName"
              className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
            >
              Last name
            </label>
            <input
              ref={lastNameRef}
              type="text"
              id="signup-lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              placeholder="e.g. Perera"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'signup-lastName-error' : undefined}
              className={`w-full rounded-[10px] border-[1.5px] py-3 px-3.5 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 transition-all duration-150 outline-none ${
                errors.lastName
                  ? 'border-brand-error focus:border-brand-error focus:ring-4 focus:ring-brand-error/20'
                  : 'border-brand-border dark:border-brand-darkBorder focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20'
              }`}
            />
            {errors.lastName && (
              <p
                id="signup-lastName-error"
                className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
          >
            Email address
          </label>
          <input
            ref={emailRef}
            type="email"
            id="signup-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            className={`w-full rounded-[10px] border-[1.5px] py-3 px-3.5 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 transition-all duration-150 outline-none ${
              errors.email
                ? 'border-brand-error focus:border-brand-error focus:ring-4 focus:ring-brand-error/20'
                : 'border-brand-border dark:border-brand-darkBorder focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20'
            }`}
          />
          {errors.email && (
            <p
              id="signup-email-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Student ID (Optional) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="signup-studentId"
              className="block text-xs font-semibold text-brand-text dark:text-brand-darkText"
            >
              Student ID
            </label>
            <span className="text-[11px] text-brand-muted dark:text-brand-darkText/60">
              Optional
            </span>
          </div>
          <input
            type="text"
            id="signup-studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            placeholder="e.g. ST2026/048"
            className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder py-3 px-3.5 text-sm bg-white dark:bg-brand-darkSoft text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/60 focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 transition-all duration-150 outline-none"
          />
        </div>

        {/* Password + Strength Meter */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
          >
            Password
          </label>
          <PasswordInput
            ref={passwordRef}
            id="signup-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            hasError={!!errors.password}
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
          />
          {errors.password && (
            <p
              id="signup-password-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
          {/* Live Strength Meter */}
          <StrengthMeter password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="signup-confirmPassword"
            className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5"
          >
            Confirm password
          </label>
          <PasswordInput
            ref={confirmPasswordRef}
            id="signup-confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            hasError={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'signup-confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <p
              id="signup-confirmPassword-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-brand-text dark:text-brand-darkText">
            <input
              ref={agreeTermsRef}
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              aria-invalid={!!errors.agreeTerms}
              aria-describedby={errors.agreeTerms ? 'signup-agreeTerms-error' : undefined}
              className="w-4 h-4 mt-0.5 rounded border-brand-border dark:border-brand-darkBorder text-brand-navy focus:ring-brand-focus cursor-pointer shrink-0"
            />
            <span className="leading-snug">
              I agree to the{' '}
              <a href="#" className="font-semibold text-brand-focus hover:underline">
                Terms and Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p
              id="signup-agreeTerms-error"
              className="mt-1.5 text-xs text-brand-error font-medium flex items-center gap-1 ml-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.agreeTerms}
            </p>
          )}
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>

        {/* Link to Sign In */}
        <div className="text-center pt-3">
          <p className="text-xs text-brand-muted dark:text-brand-darkText/70">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-brand-navy dark:text-white hover:underline ml-0.5"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
