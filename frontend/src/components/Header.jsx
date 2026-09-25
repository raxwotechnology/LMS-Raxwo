import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';

const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('studentUser');
      if (stored) {
        setStudent(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      // Navigate to courses page if not already there
      if (window.location.pathname !== '/courses') {
        navigate('/courses');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Clear search if input is empty
    if (e.target.value.trim() === '') {
      onSearch('');
    }
  };

  const handleLogoClick = () => {
    navigate('/courses');
  };

  const handleLogout = () => {
    localStorage.removeItem('studentUser');
    navigate('/student/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={handleLogoClick}>
          <img src={logo} alt="Wisdom Institute Logo" className="logo-image" />
          <span className="logo-text">WISDOM INSTITUTE</span>
        </div>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {student ? (
            <>
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
                    background: '#0369A1',
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/student/login')}
              style={{
                background: '#0369A1',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
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
