'use client';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

const safeLocalStorage = {
  getItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.getItem(key) : null),
  setItem: (key, val) => (typeof window !== 'undefined' ? window.safeLocalStorage.setItem(key, val) : undefined),
  removeItem: (key) => (typeof window !== 'undefined' ? window.safeLocalStorage.removeItem(key) : undefined),
};

import React, { useState } from 'react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigate = (path) => router.push(path);

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
      const response = await fetch(`/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        safeLocalStorage.setItem('adminToken', data.data.token);
        safeLocalStorage.setItem('user', JSON.stringify(data.data.user));
        safeLocalStorage.setItem('userType', data.data.user.type);
        
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
    <div className={styles['login-page'] || 'login-page'}>
      <div className={styles['login-container'] || 'login-container'}>
        <div className={styles['login-header'] || 'login-header'}>
          <h1>Dashboard Login</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles['login-form'] || 'login-form'}>
          {error && <div className={styles['error-message'] || 'error-message'}>{error}</div>}
          
          <div className={styles['form-group'] || 'form-group'}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Example@gmail.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles['form-group'] || 'form-group'}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles['login-button'] || 'login-button'} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* <div className={styles['login-footer'] || 'login-footer'}>
          <p>Don't have an account? Contact your system administrator</p>
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
