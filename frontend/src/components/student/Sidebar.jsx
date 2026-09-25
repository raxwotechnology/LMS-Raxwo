import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import { getImageUrl } from '../../utils/imageUtils';
import logo from '../../assets/logo.png';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    name: 'All Subjects',
    href: '/courses',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: 'My Learning',
    href: '/my-learning',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    name: 'Classes',
    href: '/classes',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    name: 'Results',
    href: '/results',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    name: 'Exams',
    href: '/exams',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    name: 'Exam Papers',
    href: '/exam-papers',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    name: 'Notifications',
    href: '/notifications',
    hasBadge: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { unreadNotificationsCount, studentUser } = useStudent();

  const handleSignOut = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    localStorage.removeItem('student');
    navigate('/student/login');
  };

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR (>= 860px) */}
      <aside className="hidden split:flex flex-col justify-between w-[240px] h-screen bg-brand-navy text-white fixed top-0 left-0 z-40 p-5 shadow-lg border-r border-brand-navy/30 select-none">
        <div>
          {/* Brand Header */}
          <Link to="/dashboard" className="flex items-center gap-3 mb-8 group">
            <div
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-sm shrink-0"
              style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
            >
              <img
                src={logo}
                alt="Wisdom Institute Logo"
                className="w-full h-full object-contain"
                style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider uppercase block text-white">
                Wisdom Institute
              </span>
              <span className="text-[11px] text-brand-sidebarInactive block">Student Portal</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1.5" aria-label="Student portal navigation">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-brand-sidebarInactive hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>

                  {item.hasBadge && unreadNotificationsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-brand-badgeRed rounded-full shadow-sm">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Student Profile Card */}
        <div className="pt-4 border-t border-white/15">
          <Link to="/profile" className="block mb-3">
            <div className="flex items-center gap-3 px-1">
              {studentUser?.profileImage ? (
                <img
                  src={getImageUrl(studentUser.profileImage)}
                  alt={studentUser?.name || 'Profile'}
                  className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-sidebarInactive text-brand-navy flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                  {studentUser?.name ? studentUser.name.charAt(0) : 'S'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {studentUser?.name || 'Student'}
                </p>
                <p className="text-[11px] text-brand-sidebarInactive truncate leading-tight mt-0.5">
                  {studentUser?.studentId || 'ST-2026'}
                </p>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-brand-sidebarInactive hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HORIZONTALLY SCROLLABLE TOP NAV (< 860px) */}
      <header className="split:hidden fixed top-0 left-0 right-0 z-40 bg-brand-navy text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div
              className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0"
              style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
            >
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain"
                style={{ width: '22px', height: '22px', maxWidth: '22px', maxHeight: '22px', objectFit: 'contain' }}
              />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase text-white">
              Wisdom Institute
            </span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-[11px] text-brand-sidebarInactive hover:text-white px-2.5 py-1 rounded bg-white/[0.08]"
          >
            Sign out
          </button>
        </div>

        {/* Horizontal scrollable nav list */}
        <nav
          className="flex items-center gap-1 overflow-x-auto px-3 py-2 no-scrollbar scroll-smooth"
          aria-label="Mobile student navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-brand-sidebarInactive hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span className="scale-90">{item.icon}</span>
                <span>{item.name}</span>
                {item.hasBadge && unreadNotificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-brand-badgeRed inline-block ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
