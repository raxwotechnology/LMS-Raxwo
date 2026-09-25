'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useStudent } from '@/context/StudentContext';

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
    name: 'All Courses',
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
    name: 'Certificates',
    href: '/certificates',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadNotificationsCount, studentUser } = useStudent();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student');
      localStorage.removeItem('studentUser');
      document.cookie = 'student_token=; path=/; max-age=0;';
      router.push('/login');
    }
  };

  return (
    <>
      {/* ==================================================================== */}
      {/* DESKTOP FIXED SIDEBAR (>= 860px) */}
      {/* ==================================================================== */}
      <aside className="hidden split:flex flex-col justify-between w-[240px] h-screen bg-brand-navy dark:bg-brand-darkBg text-white fixed top-0 left-0 z-40 p-5 shadow-lg border-r border-brand-navy/30 dark:border-brand-darkBorder select-none">
        <div>
          {/* Brand Header */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-8 group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-sm shrink-0">
              <Image
                src="/logo.png"
                alt="Wisdom Institute Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider uppercase block text-white">
                Wisdom Institute
              </span>
              <span className="text-[11px] text-brand-soft/70 block">Student Portal</span>
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
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-brand-navy' : 'text-white/70'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>

                  {item.hasBadge && unreadNotificationsCount > 0 && (
                    <span className="bg-brand-badgeRed text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Student Profile & Logout Footer */}
        <div className="pt-4 border-t border-white/15">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {studentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{studentUser.name}</p>
              <p className="text-[10px] text-white/60 truncate">{studentUser.studentId}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MOBILE / TABLET TOP SCROLL NAV (< 860px) */}
      {/* ==================================================================== */}
      <header className="split:hidden sticky top-0 z-40 bg-brand-navy dark:bg-brand-darkBg text-white shadow-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1 shrink-0">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" priority />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase text-white">
              Wisdom Institute
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 py-1 px-2.5 bg-white/10 rounded-full"
          >
            <span>Sign out</span>
          </button>
        </div>

        {/* Horizontal Scrollable Tabs */}
        <nav className="flex overflow-x-auto no-scrollbar py-2 px-3 gap-2 text-xs select-none">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-white/80 hover:text-white bg-white/5'
                }`}
              >
                <span>{item.name}</span>
                {item.hasBadge && unreadNotificationsCount > 0 && (
                  <span className="bg-brand-badgeRed text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
