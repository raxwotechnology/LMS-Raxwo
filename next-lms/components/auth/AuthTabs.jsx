'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthTabs() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';

  return (
    <div
      role="tablist"
      aria-label="Authentication Options"
      className="flex p-1 bg-brand-soft/70 dark:bg-brand-darkSoft/80 border border-brand-border dark:border-brand-darkBorder rounded-[12px] mb-8"
    >
      <Link
        href="/login"
        role="tab"
        aria-selected={isLogin}
        aria-controls="auth-panel"
        className={`flex-1 text-center py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 motion-reduce:transition-none ${
          isLogin
            ? 'bg-brand-navy text-white shadow-sm dark:bg-white dark:text-brand-navy'
            : 'text-brand-muted hover:text-brand-text dark:text-brand-darkText/70 dark:hover:text-brand-darkText'
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        role="tab"
        aria-selected={isRegister}
        aria-controls="auth-panel"
        className={`flex-1 text-center py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 motion-reduce:transition-none ${
          isRegister
            ? 'bg-brand-navy text-white shadow-sm dark:bg-white dark:text-brand-navy'
            : 'text-brand-muted hover:text-brand-text dark:text-brand-darkText/70 dark:hover:text-brand-darkText'
        }`}
      >
        Sign up
      </Link>
    </div>
  );
}
