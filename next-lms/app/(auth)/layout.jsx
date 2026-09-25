import Image from 'next/image';
import BrandPanel from '@/components/auth/BrandPanel';
import AuthTabs from '@/components/auth/AuthTabs';

export const metadata = {
  title: 'Student Portal | Wisdom Institute',
  description: 'Sign in or register for your Wisdom Institute student account.',
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col split:flex-row bg-brand-soft dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText transition-colors duration-200">
      {/* Left Split: Navy Brand Panel (Desktop only >= 860px) */}
      <BrandPanel />

      {/* Right Split: Form Card Area */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="w-full max-w-[440px] mx-auto py-8">
          {/* Compact Mobile Header (Shown only < 860px) */}
          <div className="flex split:hidden flex-col items-center justify-center gap-2.5 mb-6 text-center">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-1.5 shadow-md border border-brand-border/80">
              <Image
                src="/logo.png"
                alt="Wisdom Institute Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="block font-bold text-base tracking-wider uppercase text-brand-navy dark:text-white">
                Wisdom Institute
              </span>
              <span className="text-xs text-brand-muted dark:text-brand-darkText/70">
                Student Learning Management System
              </span>
            </div>
          </div>

          {/* Form Card Container */}
          <div className="bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder rounded-[16px] p-6 sm:p-8 shadow-sm">
            {/* Top Navigation Tabs */}
            <AuthTabs />

            {/* Page Content (SignInForm or SignUpForm) */}
            {children}
          </div>

          {/* Footer note for mobile */}
          <div className="split:hidden text-center mt-6 text-xs text-brand-muted dark:text-brand-darkText/60">
            © {new Date().getFullYear()} Wisdom Institute. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}
