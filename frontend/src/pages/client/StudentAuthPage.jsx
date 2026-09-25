import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import './StudentAuthPage.css';
import logo from '../../assets/logo.png';

export default function StudentAuthPage({ initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const navigate = useNavigate();

  // Sign In State
  const [signInData, setSignInData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });
  const [signInErrors, setSignInErrors] = useState({});
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);
  const [isSignInSuccess, setIsSignInSuccess] = useState(false);
  const [signedInUser, setSignedInUser] = useState(null);

  // Sign In Refs
  const signInIdentifierRef = useRef(null);
  const signInPasswordRef = useRef(null);

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [signUpErrors, setSignUpErrors] = useState({});
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [signUpFeedback, setSignUpFeedback] = useState('');
  const [linkedStudent, setLinkedStudent] = useState(null);

  // Sign Up Refs
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const signUpPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const agreeTermsRef = useRef(null);

  // Password strength calculation (1 to 4)
  const calculateStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;
    return Math.max(1, Math.min(4, score));
  };

  const strength = calculateStrength(signUpData.password);
  const strengthLabels = ['', 'Too weak', 'Weak', 'Good', 'Strong'];

  // Handle Sign In Input Change
  const handleSignInChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignInData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (signInErrors[name]) {
      setSignInErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Handle Sign Up Input Change
  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignUpData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (signUpErrors[name]) {
      setSignUpErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Validate Sign In
  const validateSignIn = () => {
    const errors = {};
    if (!signInData.identifier.trim()) {
      errors.identifier = 'Please enter your student email or student ID.';
    }
    if (!signInData.password) {
      errors.password = 'Please enter your password.';
    }
    setSignInErrors(errors);

    if (errors.identifier && signInIdentifierRef.current) {
      signInIdentifierRef.current.focus();
    } else if (errors.password && signInPasswordRef.current) {
      signInPasswordRef.current.focus();
    }

    return Object.keys(errors).length === 0;
  };

  // Validate Sign Up
  const validateSignUp = () => {
    const errors = {};
    if (!signUpData.firstName.trim()) {
      errors.firstName = 'Enter your first name.';
    }
    if (!signUpData.lastName.trim()) {
      errors.lastName = 'Enter your last name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signUpData.email.trim()) {
      errors.email = 'Enter your email address.';
    } else if (!emailRegex.test(signUpData.email.trim())) {
      errors.email = 'Enter a valid email address, like name@example.com.';
    }

    if (!signUpData.password) {
      errors.password = 'Enter a password.';
    } else if (signUpData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!/[a-zA-Z]/.test(signUpData.password) || !/\d/.test(signUpData.password)) {
      errors.password = 'Password must include at least one letter and one number.';
    }

    if (!signUpData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (signUpData.confirmPassword !== signUpData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!signUpData.agreeTerms) {
      errors.agreeTerms = 'You must agree to the Terms and Privacy Policy.';
    }

    setSignUpErrors(errors);

    if (errors.firstName && firstNameRef.current) firstNameRef.current.focus();
    else if (errors.lastName && lastNameRef.current) lastNameRef.current.focus();
    else if (errors.email && emailRef.current) emailRef.current.focus();
    else if (errors.password && signUpPasswordRef.current) signUpPasswordRef.current.focus();
    else if (errors.confirmPassword && confirmPasswordRef.current) confirmPasswordRef.current.focus();
    else if (errors.agreeTerms && agreeTermsRef.current) agreeTermsRef.current.focus();

    return Object.keys(errors).length === 0;
  };

  // Submit Sign In
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setIsSignInSubmitting(true);
    setSignInErrors({});

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signInData.identifier.trim(),
          password: signInData.password,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success && resData.data) {
        const student = resData.data;
        const user = {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          profileImage: student.profileImage || '',
          role: 'student',
          subjects: student.subjects || [],
          totalPrice: student.totalPrice || 0,
        };

        localStorage.setItem('studentToken', resData.token || '');
        localStorage.setItem('studentUser', JSON.stringify(user));
        setSignedInUser(user);
        setIsSignInSuccess(true);

        setTimeout(() => {
          navigate('/dashboard');
        }, 1100);
      } else {
        setSignInErrors({
          identifier: resData.message || 'Unable to sign in. Please verify your email / Student ID and password.',
        });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setSignInErrors({
        identifier: 'Connection error. Please check if the LMS backend server is running.',
      });
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  // Submit Sign Up
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setIsSignUpSubmitting(true);
    setSignUpErrors({});

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpData.email.trim(),
          password: signUpData.password,
          firstName: signUpData.firstName.trim(),
          lastName: signUpData.lastName.trim(),
          studentId: signUpData.studentId.trim(),
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success && resData.data) {
        const student = resData.data;
        const user = {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          profileImage: student.profileImage || '',
          role: 'student',
          subjects: student.subjects || [],
          totalPrice: student.totalPrice || 0,
        };

        localStorage.setItem('studentToken', resData.token || '');
        localStorage.setItem('studentUser', JSON.stringify(user));
        setLinkedStudent(student);
        setSignUpFeedback(
          resData.isLinkedToAdminRecord
            ? `Your account was successfully linked to your Wisdom Institute registration (Student ID: ${student.studentId})!`
            : 'Your student account has been created!'
        );
        setIsSignUpSuccess(true);
      } else {
        setSignUpErrors({
          email: resData.message || 'Registration failed. Please try again.',
        });
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setSignUpErrors({
        email: 'Connection error. Please check if the backend server is running.',
      });
    } finally {
      setIsSignUpSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Split: Brand Panel */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-header">
          <div className="auth-brand-logo-circle">
            <img src={logo} alt="Wisdom Institute Logo" style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }} />
          </div>
          <span className="auth-brand-title">Wisdom Institute</span>
        </div>

        <div className="auth-brand-content">
          <span className="auth-brand-badge">Official Student Portal</span>
          <h1 className="auth-brand-headline">
            Your classes, results and schedule in one place.
          </h1>
          <p className="auth-brand-supporting">
            Manage your academic journey with seamless access to course enrollments,
            attendance records, and examination performance.
          </p>
        </div>

        <div className="auth-brand-footer">
          © {new Date().getFullYear()} Wisdom Institute. All rights reserved.
        </div>

        {/* Stepped-line geometric SVG echoing logo */}
        <div className="auth-brand-svg-decor" aria-hidden="true">
          <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 250 L120 180 L180 240 L260 160" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 280 L150 210 L210 270 L290 190" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M110 310 L180 240 L240 300 L320 220" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M230 110 L250 90 L270 110" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M230 135 L250 115 L270 135" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </aside>

      {/* Right Split: Form Area */}
      <main className="auth-form-area">
        <div className="auth-form-container">
          {/* Mobile Header (< 860px) */}
          <div className="auth-mobile-header">
            <div className="auth-mobile-logo-circle">
              <img src={logo} alt="Wisdom Institute Logo" style={{ width: '40px', height: '40px', maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }} />
            </div>
            <div>
              <span className="auth-mobile-title">Wisdom Institute</span>
              <div className="auth-mobile-subtitle">Student Learning Management System</div>
            </div>
          </div>

          {/* Top Switcher Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#475569',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#1e40af';
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Admin / Staff Portal &rarr;
            </button>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            {/* Tabs */}
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => setMode('signin')}
                className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => setMode('signup')}
                className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              >
                Sign up
              </button>
            </div>

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <>
                {isSignInSuccess ? (
                  <div className="auth-success-screen">
                    <div className="auth-success-icon-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h3>You are signed in</h3>
                    <p>
                      Welcome back, <strong>{signedInUser?.name || 'Student'}</strong>. Redirecting to your dashboard...
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="auth-submit-btn"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="auth-header">
                      <h2>Welcome back</h2>
                      <p>Sign in to your student account.</p>
                    </div>

                    <form onSubmit={handleSignInSubmit} noValidate className="auth-form">
                      {/* Identifier */}
                      <div className="auth-form-group">
                        <label className="auth-label">Email or student ID</label>
                        <input
                          ref={signInIdentifierRef}
                          type="text"
                          name="identifier"
                          value={signInData.identifier}
                          onChange={handleSignInChange}
                          placeholder="you@example.com"
                          className={`auth-input ${signInErrors.identifier ? 'has-error' : ''}`}
                        />
                        {signInErrors.identifier && (
                          <span className="auth-field-error">
                            ⚠️ {signInErrors.identifier}
                          </span>
                        )}
                      </div>

                      {/* Password */}
                      <div className="auth-form-group">
                        <div className="auth-label-row">
                          <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                          <span className="auth-forgot-link">Forgot password?</span>
                        </div>
                        <div className="auth-password-wrapper">
                          <input
                            ref={signInPasswordRef}
                            type={showSignInPassword ? 'text' : 'password'}
                            name="password"
                            value={signInData.password}
                            onChange={handleSignInChange}
                            placeholder="Enter your password"
                            className={`auth-input ${signInErrors.password ? 'has-error' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="auth-show-btn"
                          >
                            {showSignInPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {signInErrors.password && (
                          <span className="auth-field-error">
                            ⚠️ {signInErrors.password}
                          </span>
                        )}
                      </div>

                      {/* Keep me signed in */}
                      <label className="auth-checkbox-label">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={signInData.rememberMe}
                          onChange={handleSignInChange}
                        />
                        <span>Keep me signed in</span>
                      </label>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSignInSubmitting}
                        className="auth-submit-btn"
                      >
                        {isSignInSubmitting ? 'Signing in...' : 'Sign in'}
                      </button>

                      <div className="auth-switch-prompt">
                        New student?{' '}
                        <span
                          className="auth-switch-link"
                          onClick={() => setMode('signup')}
                        >
                          Create an account
                        </span>
                      </div>

                      {/* Admin / Staff Login Switch Button */}
                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.6rem' }}>
                          Are you an Administrator or Staff Member?
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/login')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#1e40af',
                            backgroundColor: '#eff6ff',
                            border: '1.5px solid #bfdbfe',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#dbeafe';
                            e.currentTarget.style.borderColor = '#93c5fd';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                            e.currentTarget.style.borderColor = '#bfdbfe';
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          Go to Admin Login &rarr;
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <>
                {isSignUpSuccess ? (
                  <div className="auth-success-screen">
                    <div className="auth-success-icon-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h3>Account Ready!</h3>
                    <p style={{ fontWeight: 600, color: '#0369A1' }}>
                      {signUpFeedback || 'Welcome to Wisdom Institute!'}
                    </p>
                    {linkedStudent && (
                      <div style={{ margin: '1rem 0', padding: '0.75rem', background: '#f3f4fb', borderRadius: '10px', fontSize: '0.8rem', textAlign: 'left', border: '1px solid #d9dbee' }}>
                        <div><strong>Student ID:</strong> {linkedStudent.studentId}</div>
                        <div><strong>Student Name:</strong> {linkedStudent.name}</div>
                        <div><strong>Enrolled Subjects:</strong> {linkedStudent.subjects && linkedStudent.subjects.length > 0 ? linkedStudent.subjects.map(s => s.name || s).join(', ') : 'Assigned upon enrollment'}</div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="auth-submit-btn"
                    >
                      Proceed to My Student Dashboard &rarr;
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="auth-header">
                      <h2>Create your account</h2>
                      <p>Join Wisdom Institute as a student.</p>
                      <p style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: '0.35rem', fontWeight: 500 }}>
                        💡 Tip: Enter the email you gave to the institute administration to immediately link your registered subjects and marks.
                      </p>
                    </div>

                    <form onSubmit={handleSignUpSubmit} noValidate className="auth-form">
                      {/* Name Row */}
                      <div className="auth-form-row">
                        <div className="auth-form-group">
                          <label className="auth-label">First name</label>
                          <input
                            ref={firstNameRef}
                            type="text"
                            name="firstName"
                            value={signUpData.firstName}
                            onChange={handleSignUpChange}
                            placeholder="Kasun"
                            className={`auth-input ${signUpErrors.firstName ? 'has-error' : ''}`}
                          />
                          {signUpErrors.firstName && (
                            <span className="auth-field-error">
                              ⚠️ {signUpErrors.firstName}
                            </span>
                          )}
                        </div>

                        <div className="auth-form-group">
                          <label className="auth-label">Last name</label>
                          <input
                            ref={lastNameRef}
                            type="text"
                            name="lastName"
                            value={signUpData.lastName}
                            onChange={handleSignUpChange}
                            placeholder="Perera"
                            className={`auth-input ${signUpErrors.lastName ? 'has-error' : ''}`}
                          />
                          {signUpErrors.lastName && (
                            <span className="auth-field-error">
                              ⚠️ {signUpErrors.lastName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="auth-form-group">
                        <label className="auth-label">Email address</label>
                        <input
                          ref={emailRef}
                          type="email"
                          name="email"
                          value={signUpData.email}
                          onChange={handleSignUpChange}
                          placeholder="name@example.com"
                          className={`auth-input ${signUpErrors.email ? 'has-error' : ''}`}
                        />
                        {signUpErrors.email && (
                          <span className="auth-field-error">
                            ⚠️ {signUpErrors.email}
                          </span>
                        )}
                      </div>

                      {/* Student ID */}
                      <div className="auth-form-group">
                        <div className="auth-label-row">
                          <label className="auth-label" style={{ marginBottom: 0 }}>Student ID</label>
                          <span className="auth-optional-text">Optional</span>
                        </div>
                        <input
                          type="text"
                          name="studentId"
                          value={signUpData.studentId}
                          onChange={handleSignUpChange}
                          placeholder="e.g. ST2026/048"
                          className="auth-input"
                        />
                      </div>

                      {/* Password */}
                      <div className="auth-form-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-password-wrapper">
                          <input
                            ref={signUpPasswordRef}
                            type={showSignUpPassword ? 'text' : 'password'}
                            name="password"
                            value={signUpData.password}
                            onChange={handleSignUpChange}
                            placeholder="At least 8 characters"
                            className={`auth-input ${signUpErrors.password ? 'has-error' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="auth-show-btn"
                          >
                            {showSignUpPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {signUpErrors.password && (
                          <span className="auth-field-error">
                            ⚠️ {signUpErrors.password}
                          </span>
                        )}

                        {/* Live Strength Meter */}
                        {signUpData.password && (
                          <div className="strength-meter">
                            <div className="strength-meter-bars">
                              {[1, 2, 3, 4].map((barIdx) => (
                                <div
                                  key={barIdx}
                                  className={`strength-bar ${
                                    barIdx <= strength ? `strength-${strength}` : ''
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="strength-meter-label">
                              <span>Password strength</span>
                              <span className={`strength-text-${strength}`}>
                                {strengthLabels[strength]}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="auth-form-group">
                        <label className="auth-label">Confirm password</label>
                        <div className="auth-password-wrapper">
                          <input
                            ref={confirmPasswordRef}
                            type={showSignUpConfirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={signUpData.confirmPassword}
                            onChange={handleSignUpChange}
                            placeholder="Re-enter your password"
                            className={`auth-input ${signUpErrors.confirmPassword ? 'has-error' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                            className="auth-show-btn"
                          >
                            {showSignUpConfirm ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {signUpErrors.confirmPassword && (
                          <span className="auth-field-error">
                            ⚠️ {signUpErrors.confirmPassword}
                          </span>
                        )}
                      </div>

                      {/* Agree Terms */}
                      <label className="auth-checkbox-label">
                        <input
                          ref={agreeTermsRef}
                          type="checkbox"
                          name="agreeTerms"
                          checked={signUpData.agreeTerms}
                          onChange={handleSignUpChange}
                        />
                        <span>
                          I agree to the <a href="#terms">Terms and Privacy Policy</a>.
                        </span>
                      </label>
                      {signUpErrors.agreeTerms && (
                        <span className="auth-field-error">
                          ⚠️ {signUpErrors.agreeTerms}
                        </span>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSignUpSubmitting}
                        className="auth-submit-btn"
                      >
                        {isSignUpSubmitting ? 'Creating account...' : 'Create account'}
                      </button>

                      <div className="auth-switch-prompt">
                        Already registered?{' '}
                        <span
                          className="auth-switch-link"
                          onClick={() => setMode('signin')}
                        >
                          Sign in
                        </span>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}