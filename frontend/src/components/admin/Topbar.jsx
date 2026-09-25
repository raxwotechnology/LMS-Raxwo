import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ userName }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // User details from localStorage or props
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = localStorage.getItem('userType');
  const rawName = (userName && userName !== 'Admin') ? userName : (storedUser.name && storedUser.name !== 'Admin' ? storedUser.name : 'Wisdom Admin');
  const displayName = rawName;
  const displayRole = userType === 'admin' ? 'Administrator' : (storedUser.role || 'Staff');

  // Compute initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'WA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(displayName);

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      title: 'New Payment Recorded',
      desc: 'Shanl Perera paid LKR 4,000.00 for Mathematics',
      time: '12m ago',
      read: false
    },
    {
      id: 2,
      type: 'student',
      title: 'New Student Enrollment',
      desc: 'Sara Cebe enrolled in English (Grade 12)',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      type: 'exam',
      title: 'Exam Attendance Marked',
      desc: 'Monthly test attendance updated for Science class',
      time: '3h ago',
      read: false
    },
    {
      id: 4,
      type: 'class',
      title: 'Upcoming Class Session',
      desc: 'Chemistry regular class scheduled for 11:00 AM',
      time: '5h ago',
      read: true
    },
    {
      id: 5,
      type: 'system',
      title: 'Monthly Summary Ready',
      desc: 'September income & attendance report generated',
      time: '1d ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Toggle handlers (mutual exclusion)
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  };

  // Click outside and ESC key listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleSidebar = () => {
    document.dispatchEvent(new Event('toggle-sidebar'));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setIsProfileOpen(false);
    navigate('/admin/login');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (q.includes('pay') || q.includes('fee')) {
        navigate('/admin/payment');
      } else if (q.includes('class')) {
        navigate('/admin/class');
      } else if (q.includes('exam') || q.includes('mark')) {
        navigate('/admin/exam');
      } else if (q.includes('employee') || q.includes('teacher') || q.includes('staff')) {
        navigate('/admin/employee');
      } else {
        navigate(`/admin/students?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return (
          <span className="notif-badge-icon payment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </span>
        );
      case 'student':
        return (
          <span className="notif-badge-icon student">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d8ecf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </span>
        );
      case 'exam':
        return (
          <span className="notif-badge-icon exam">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
        );
      case 'class':
        return (
          <span className="notif-badge-icon class">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="notif-badge-icon system">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        );
    }
  };

  return (
    <header className="topbar">
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        className="hamburger-btn"
        onClick={handleToggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* 1. Left Side: Search Input taking up space, capped at max-width */}
      <div className="topbar-search-container">
        <div className="topbar-search-wrapper">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search students, payments, classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Global admin search"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-topbar-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* 2. Right Side, Grouped Together */}
      <div className="topbar-right-group">
        
        {/* 2A. Notification Bell Icon Button (Rounded Square with Red Badge) */}
        <div className="topbar-action-item" ref={notificationsRef}>
          <button
            type="button"
            className={`topbar-bell-btn ${isNotificationsOpen ? 'active' : ''}`}
            onClick={toggleNotifications}
            aria-expanded={isNotificationsOpen}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-red-badge" aria-label={`${unreadCount} new notifications`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="topbar-dropdown notifications-dropdown-panel" role="region" aria-label="Notifications panel">
              <div className="dropdown-panel-header">
                <div className="panel-title-group">
                  <h3 className="panel-title">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="unread-pill">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notifications-list-scrollable">
                {notifications.length === 0 ? (
                  <div className="empty-notif-message">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif.id)}
                    >
                      <div className="notif-icon-col">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="notif-content-col">
                        <div className="notif-title-row">
                          <p className="notif-title">{notif.title}</p>
                          {!notif.read && <span className="notif-blue-dot" aria-hidden="true" />}
                        </div>
                        <p className="notif-desc">{notif.desc}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dropdown-panel-footer">
                <button
                  type="button"
                  className="view-all-notifs-btn"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2B. Vertical Divider */}
        <div className="topbar-vertical-divider" aria-hidden="true" />

        {/* 2C. Profile Section (Avatar + Name/Role + Chevron) */}
        <div className="topbar-action-item" ref={profileRef}>
          <button
            type="button"
            className={`topbar-profile-trigger ${isProfileOpen ? 'active' : ''}`}
            onClick={toggleProfile}
            aria-expanded={isProfileOpen}
            aria-label="Admin account menu"
          >
            {/* Circular Gradient Avatar with Initials */}
            <div className="profile-avatar-gradient">
              {initials}
            </div>

            {/* Name & Role */}
            <div className="profile-text-details">
              <span className="profile-user-name">{displayName}</span>
              <span className="profile-user-role">{displayRole}</span>
            </div>

            {/* Small Chevron */}
            <svg
              className={`profile-chevron-icon ${isProfileOpen ? 'rotated' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="topbar-dropdown profile-dropdown-panel" role="menu" aria-label="User profile options">
              <div className="profile-dropdown-top">
                <div className="profile-avatar-gradient large">
                  {initials}
                </div>
                <div className="dropdown-user-meta">
                  <p className="meta-name">{displayName}</p>
                  <p className="meta-email">{storedUser.email || 'admin@wisdom.lk'}</p>
                  <span className="meta-role-pill">{displayRole}</span>
                </div>
              </div>

              <div className="dropdown-panel-divider" />

              <div className="dropdown-action-list">
                <button
                  type="button"
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/employee');
                  }}
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/Dashboard');
                  }}
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Settings</span>
                </button>

                <div className="dropdown-panel-divider" />

                <button
                  type="button"
                  className="dropdown-action-btn logout-action-btn"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
