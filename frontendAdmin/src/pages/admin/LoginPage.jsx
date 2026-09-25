import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import './LoginPage.css';
import logo from '../../assets/logo.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
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
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('userType', data.data.user.type);

        // Navigate to dashboard
        navigate('/admin/Dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Split: Brand Panel */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-header">
          <div className="auth-brand-logo-circle">
            <img
              src={logo}
              alt="Wisdom Institute Logo"
              style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }}
            />
          </div>
          <span className="auth-brand-title">Wisdom Institute</span>
        </div>

        <div className="auth-brand-content">
          <span className="auth-brand-badge">Official Admin Portal</span>
          <h1 className="auth-brand-headline">
            Manage your institute, all from one dashboard.
          </h1>
          <p className="auth-brand-supporting">
            Oversee student records, staff, classes, payments and examinations
            with a single, secure administrator login.
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
              <img
                src={logo}
                alt="Wisdom Institute Logo"
                style={{ width: '40px', height: '40px', maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <span className="auth-mobile-title">Wisdom Institute</span>
              <div className="auth-mobile-subtitle">Admin Learning Management System</div>
            </div>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            <div className="auth-header">
              <h2>Dashboard Login</h2>
              <p>Sign in to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="auth-form">
              {error && (
                <div className="auth-server-error">⚠️ {error}</div>
              )}

              {/* Email */}
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Example@gmail.com"
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              {/* Password */}
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="password">Password</label>
                <div className="auth-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-show-btn"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;