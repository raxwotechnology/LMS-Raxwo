'use client';

import React from 'react';
import { useStudent } from '@/context/StudentContext';

export default function ClassesPage() {
  const { classes, recordAttendance } = useStudent();

  const attendedCount = classes.filter((c) => c.attended).length;
  const attendanceRate = classes.length > 0 ? Math.round((attendedCount / classes.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 dark:border-brand-darkBorder/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text dark:text-white tracking-tight">
            Live Class Schedule
          </h1>
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70 mt-1">
            Attend live interactive lectures and seminars led by Wisdom Institute lecturers.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3 p-2 px-4 rounded-xl bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder shadow-xs">
          <div className="text-right">
            <span className="text-[11px] text-brand-muted uppercase block font-medium">
              Attendance
            </span>
            <span className="text-sm font-bold text-brand-text dark:text-white">
              {attendedCount} of {classes.length} Attended ({attendanceRate}%)
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-success/15 text-brand-success flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>
      </div>

      {/* Class Schedule List */}
      <div className="space-y-4">
        {classes.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-brand-darkSoft rounded-[14px] border border-brand-border dark:border-brand-darkBorder">
            <p className="text-sm text-brand-muted dark:text-brand-darkText/70">
              No live classes currently scheduled.
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-[14px] border border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSoft hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="w-14 h-14 rounded-xl bg-brand-soft dark:bg-brand-darkBg border border-brand-border dark:border-brand-darkBorder flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted dark:text-brand-darkText/60">
                    Live
                  </span>
                  <span className="text-sm font-bold text-brand-navy dark:text-white">
                    {cls.date.split(',')[0]}
                  </span>
                </div>

                {/* Class details */}
                <div>
                  <span className="text-[11px] font-semibold text-brand-focus uppercase tracking-wider">
                    {cls.courseTitle}
                  </span>
                  <h3 className="text-base font-bold text-brand-text dark:text-white mt-0.5">
                    {cls.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-brand-muted dark:text-brand-darkText/70">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {cls.time} ({cls.duration})
                    </span>
                    <span>&bull;</span>
                    <span>Lecturer: <strong className="text-brand-text dark:text-white">{cls.instructor}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-end md:self-center">
                {cls.attended ? (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success border border-brand-success/30">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Attended</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => recordAttendance(cls.id)}
                    className="px-5 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Join Class</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
