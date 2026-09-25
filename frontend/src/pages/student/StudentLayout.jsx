import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentProvider } from '../../context/StudentContext';
import Sidebar from '../../components/student/Sidebar';
import Toast from '../../components/student/Toast';

export default function StudentLayout() {
  return (
    <StudentProvider>
      <div className="min-h-screen bg-brand-soft/30 text-brand-text font-poppins antialiased transition-colors">
        <Sidebar />
        <Toast />

        {/* Main Content Area */}
        <main className="split:pl-[240px] pt-16 split:pt-0 min-h-screen flex flex-col">
          <div className="flex-1 w-full max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </StudentProvider>
  );
}
