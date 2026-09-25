import React from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';

export default function ExamsPage() {
  const { exams, studentUser, showToast } = useStudent();

  const handlePrintSlip = (examRecord) => {
    window.print();
  };

  const getExamStatus = (examDateStr) => {
    if (!examDateStr) return { label: 'Scheduled', color: 'bg-brand-bannerChipBg text-brand-bannerChipText font-bold shadow-xs' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(examDateStr);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Completed', color: 'bg-white text-brand-text font-bold shadow-xs' };
    } else if (diffDays === 0) {
      return { label: 'Today', color: 'bg-amber-100 text-amber-950 font-bold shadow-xs' };
    } else {
      return {
        label: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
        color: 'bg-brand-bannerChipBg text-brand-bannerChipText font-bold shadow-xs',
      };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date not specified';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2.5">
            <span>Exams & Hall Tickets</span>
            {exams.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-navy text-white">
                {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
              </span>
            )}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Official examination schedules, candidate numbers, and venue guidelines registered for your student profile.
          </p>
        </div>

        {exams.length > 0 && (
          <button
            type="button"
            onClick={() => handlePrintSlip()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-brand-border text-brand-text hover:bg-brand-soft transition-colors shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Exam Slips</span>
          </button>
        )}
      </div>

      {/* Content */}
      {exams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-brand-border space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-brand-soft text-brand-muted flex items-center justify-center mx-auto">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-brand-text">No Exams Scheduled Yet</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              When administration registers an official examination or candidate schedule for your Student ID (
              <span className="font-semibold text-brand-navy">{studentUser?.studentId || 'ST-2026'}</span>), it will appear here in real-time.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-block px-5 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Browse All Subjects
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {exams.map((exam, index) => {
            const status = getExamStatus(exam.examDate);
            const subjectsList = exam.exams && Array.isArray(exam.exams) ? exam.exams : [];
            const primarySubject = exam.subject || subjectsList[0]?.subjectName || exam.exam || 'General Examination';
            const testName = exam.examName || 'Examination';
            const candidateName = exam.studentName || `${exam.title ? exam.title + ' ' : ''}${exam.firstName || studentUser?.name || ''} ${exam.lastName || ''}`.trim();
            const studentId = exam.studentIdNumber || studentUser?.studentId || 'N/A';

            return (
              <div
                key={exam._id || index}
                className="bg-white rounded-[14px] border border-brand-border shadow-card hover:border-brand-focus/40 hover:shadow-card-hover transition-all overflow-hidden"
              >
                {/* Top strip */}
                <div className="bg-brand-navy text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-bannerChipBg text-brand-bannerChipText shadow-xs">
                        {testName}
                      </span>
                      {exam.grade && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white shadow-xs">
                          {exam.grade}
                        </span>
                      )}
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {primarySubject}
                    </h2>
                  </div>

                  {/* Exam Venue / Hall Box */}
                  <div className="bg-brand-navyHover rounded-xl p-3 border border-white/20 sm:text-right shadow-xs">
                    <p className="text-[10px] uppercase font-semibold text-brand-bannerLabel tracking-wider">Exam Hall / Venue</p>
                    <p className="text-base font-bold text-white tracking-wide">
                      {exam.examHall || 'Main Hall / TBA'}
                    </p>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Schedule & Time */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Date & Time</p>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-navy flex items-center justify-center shrink-0 border border-brand-border">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-text">
                          {formatDate(exam.examDate)}
                        </p>
                        <p className="text-xs font-semibold text-brand-navy mt-0.5">
                          Time: {exam.examTime || 'To be announced'}
                        </p>
                        <p className="text-[11px] text-brand-muted mt-0.5">Please arrive 15-30 mins prior</p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Candidate Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Registered Candidate</p>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-brand-text text-sm">
                        {candidateName}
                      </p>
                      <p className="text-brand-muted">
                        Student ID: <span className="font-medium text-brand-text">{studentId}</span>
                      </p>
                      {exam.grade && (
                        <p className="text-brand-muted">
                          Grade / Class: <span className="font-medium text-brand-text">{exam.grade}</span>
                        </p>
                      )}
                      {(exam.guardianContact || exam.guardianTelephone || exam.mobile) && (
                        <p className="text-brand-muted">
                          Guardian Contact: <span className="font-medium text-brand-text">{exam.guardianContact || exam.guardianTelephone || exam.mobile}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Subject & Lecturer Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Course & Lecturer</p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-soft text-brand-text border border-brand-border">
                          {primarySubject}
                        </span>
                      </div>
                      {exam.teacherName && (
                        <p className="text-xs text-brand-muted">
                          Lecturer / Teacher: <span className="font-semibold text-brand-text">{exam.teacherName}</span>
                        </p>
                      )}
                      {exam.examHall && (
                        <p className="text-xs text-brand-muted">
                          Location: <span className="font-medium text-brand-text">{exam.examHall}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special instructions or accommodations if any */}
                {(exam.specialNeeds === 'Yes' || exam.specialNeedsDetails) && (
                  <div className="px-5 sm:px-6 py-3 bg-amber-50 border-t border-amber-100 text-amber-900 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>Special Arrangements:</strong> {exam.specialNeedsDetails || 'Special accommodations registered by admin.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
