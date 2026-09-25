'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('student');
        if (stored) {
          setStudent(JSON.parse(stored));
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      if (typeof window !== 'undefined' && window.location.pathname !== '/courses') {
        router.push('/courses');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === '') {
      onSearch?.('');
    }
  };

  const handleLogoClick = () => {
    router.push('/courses');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('student');
      document.cookie = 'student_token=; path=/; max-age=0;';
      router.push('/login');
    }
  };

  return (
    <header className={styles['header']}>
      <div className={styles['header-container']}>
        <div className={styles['logo']} onClick={handleLogoClick}>
          <img src="/assets/logo.png" alt="Wisdom Institute Logo" className={styles['logo-image']} />
          <span className={styles['logo-text']}>WISDOM INSTITUTE</span>
        </div>

        <div className={styles['search-container']}>
          <form onSubmit={handleSearch} className={styles['search-form']}>
            <div className={styles['search-input-wrapper']}>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles['search-input']}
              />
              <button type="submit" className={styles['search-button']}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className={styles['header-actions']}>
          {student ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f3f4fb',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid #d9dbee',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#050042',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}
                >
                  {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0d0b2e' }}>
                  {student.name || 'Student'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #d9dbee',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#5c5e80',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c22b3a';
                  e.currentTarget.style.color = '#c22b3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9dbee';
                  e.currentTarget.style.color = '#5c5e80';
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className={styles['btn-primary']}
              style={{ background: '#050042' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
