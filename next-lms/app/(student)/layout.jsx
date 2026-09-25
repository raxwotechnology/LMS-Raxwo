'use client';

import React from 'react';
import { StudentProvider } from '@/context/StudentContext';
import Sidebar from '@/components/student/Sidebar';
import Toast from '@/components/student/Toast';

export default function StudentLayout({ children }) {
  return (
    <StudentProvider>
      <div className="min-h-screen bg-brand-soft/30 dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText font-poppins antialiased transition-colors">
        {/* Navigation Sidebar (Desktop 240px fixed, Mobile top-scroll) */}
        <Sidebar />

        {/* Global Toast Alert */}
        <Toast />

        {/* Main Content Area: padded left on >= 860px desktop screens */}
        <main className="split:pl-[240px] pt-16 split:pt-0 min-h-screen flex flex-col">
          <div className="flex-1 w-full max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </StudentProvider>
  );
}
