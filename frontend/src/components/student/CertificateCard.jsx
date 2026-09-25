import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

export default function CertificateCard({ course, certificate, onDownload }) {
  const isUnlocked = Boolean(certificate) || course?.progress === 100;

  if (isUnlocked) {
    const certData = certificate || {
      id: `CERT-${course.id}-2026`,
      courseTitle: course.title,
      issueDate: 'September 2026',
      instructor: course.instructor || 'Wisdom Institute Faculty',
    };

    return (
      <div className="relative overflow-hidden rounded-[14px] border border-brand-border bg-white p-6 shadow-card hover:border-brand-focus/40 hover:shadow-card-hover transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-navy via-brand-focus to-brand-success" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-[14px] bg-brand-focus/10 text-brand-focus flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success border border-brand-success/30">
            Verified Certificate
          </span>
        </div>

        <p className="text-xs uppercase tracking-wider text-brand-muted font-medium">
          Certificate of Completion
        </p>
        <h3 className="text-lg font-bold text-brand-text mt-1 mb-2 line-clamp-1">
          {certData.courseTitle || course?.title}
        </h3>
        <p className="text-xs text-brand-muted mb-4">
          Issued by <span className="font-medium text-brand-text">Wisdom Institute</span> &bull; {certData.issueDate}
        </p>

        <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
          <div className="text-[11px] text-brand-muted font-mono">
            ID: {certData.id}
          </div>
          <button
            type="button"
            onClick={() => onDownload && onDownload(certData)}
            className="px-3.5 py-1.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    );
  }

  // Locked Card
  const progress = course?.progress || 0;

  return (
    <div className="rounded-[14px] border-2 border-dashed border-brand-border bg-brand-soft/40 p-6 flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-brand-border/60 text-brand-muted flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-muted/15 text-brand-muted">
            Locked
          </span>
        </div>

        <p className="text-xs uppercase tracking-wider text-brand-muted font-medium">
          Certificate in Progress
        </p>
        <h3 className="text-lg font-bold text-brand-text/80 mt-1 mb-2 line-clamp-1">
          {course?.title}
        </h3>
        <p className="text-xs text-brand-muted mb-5">
          Reach 100% course completion and pass all required assessments to unlock your verified credential.
        </p>
      </div>

      <div className="space-y-4 pt-3 border-t border-brand-border/40">
        <ProgressBar progress={progress} label="Course Completion" />
        <Link
          to={`/courses/${course?.id}`}
          className="w-full py-2 px-3 rounded-full border border-brand-border hover:bg-brand-soft text-xs font-semibold text-brand-text flex items-center justify-center transition-colors"
        >
          Continue Learning &rarr;
        </Link>
      </div>
    </div>
  );
}
