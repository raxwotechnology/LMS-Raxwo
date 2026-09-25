import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import logo from '../../assets/logo.png';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store session credentials
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('userType', data.data.user.type || data.data.user.role || 'admin');
        
        // Navigate cleanly to dashboard
        navigate('/admin/Dashboard', { replace: true });
      } else {
        setError(data.message || 'Authentication failed. Please verify your email and password.');
      }
    } catch (err) {
      setError('Connection error. Unable to reach the server. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-layout">
        
        {/* Left Side: Brand & Institutional Hero */}
        <aside className="admin-login-hero">
          <div className="hero-backdrop-glow" aria-hidden="true" />
          
          <div className="hero-top-brand">
            <div className="hero-logo-box">
              <img src={logo} alt="Wisdom LMS" className="hero-logo-img" />
            </div>
            <div className="hero-brand-meta">
              <span className="hero-brand-name">WISDOM LMS</span>
              <span className="hero-brand-sub">Institute of Higher Education</span>
            </div>
          </div>

          <div className="hero-main-content">
            <div className="hero-badge-pill">
              <span className="pulse-indicator" />
              <span>Administrative & Faculty Control</span>
            </div>

            <h1 className="hero-main-title">
              Enterprise Academic &amp; <br />
              <span className="gradient-text">Institutional Management</span>
            </h1>

            <p className="hero-desc">
              Secure, consolidated governance platform for executive analytics, course administration, faculty compensation, and student records.
            </p>

            <ul className="hero-feature-list">
              <li className="hero-feature-item">
                <div className="feature-icon-bubble">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <strong>Role-Based Access Control</strong>
                  <span>Granular permissions for administrative and academic faculty.</span>
                </div>
              </li>

              <li className="hero-feature-item">
                <div className="feature-icon-bubble">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <strong>Financial &amp; Revenue Analytics</strong>
                  <span>Real-time fee reconciliation, automated payroll, and financial reports.</span>
                </div>
              </li>

              <li className="hero-feature-item">
                <div className="feature-icon-bubble">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <strong>Student Lifecycle Governance</strong>
                  <span>Centralized management of registrations, exams, and attendance.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="hero-bottom-footer">
            <div className="hero-security-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-bit TLS Encrypted Session • Authorized Personnel Only</span>
            </div>
          </div>
        </aside>

        {/* Right Side: Professional Sign-in Card */}
        <main className="admin-login-form-pane">
          <div className="form-pane-container">
            
            <header className="form-pane-header">
              <div className="mobile-brand-row">
                <img src={logo} alt="Wisdom LMS" className="mobile-brand-logo" />
                <span className="mobile-brand-title">Wisdom LMS Admin</span>
              </div>
              <h2 className="login-heading">Admin &amp; Staff Login</h2>
              <p className="login-subheading">Enter your verified credentials to access institutional controls.</p>
            </header>

            {error && (
              <div className="admin-alert-banner" role="alert">
                <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-auth-form" noValidate>
              
              {/* Email Input */}
              <div className="auth-field-group">
                <label htmlFor="admin-email" className="auth-field-label">
                  Institutional Email
                </label>
                <div className="auth-input-wrapper">
                  <span className="input-prefix-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="admin-email"
                    name="email"
                    className="auth-text-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@lms.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="auth-field-group">
                <div className="field-label-row">
                  <label htmlFor="admin-password" className="auth-field-label">
                    Password
                  </label>
                  <span className="field-hint">Required</span>
                </div>
                <div className="auth-input-wrapper">
                  <span className="input-prefix-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="admin-password"
                    name="password"
                    className="auth-text-input has-suffix"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-suffix-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Auxiliary Controls */}
              <div className="auth-aux-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember this terminal</span>
                </label>
                <span className="security-tag">Protected Portal</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="admin-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate &amp; Enter Dashboard</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Portal Switcher Footer */}
            <div className="form-pane-footer">
              <div className="portal-switch-box">
                <div className="portal-switch-text">
                  <span className="switch-tag">STUDENT ACCESS</span>
                  <p>Enrolled as a student or course participant?</p>
                </div>
                <button
                  type="button"
                  className="switch-portal-btn"
                  onClick={() => navigate('/student/login')}
                >
                  <span>Student Portal</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>

              <div className="system-legal-note">
                <p>&copy; {new Date().getFullYear()} Wisdom Institute of Higher Education. All rights reserved.</p>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
};

export default LoginPage;
