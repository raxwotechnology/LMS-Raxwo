'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudent } from '@/context/StudentContext';
import ProgressBar from './ProgressBar';
import CheckoutModal from './CheckoutModal';

export default function CourseCard({ course }) {
  const { isEnrolled, getCourseProgress, enrollFree } = useStudent();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const enrolled = isEnrolled(course.id);
  const progress = getCourseProgress(course.id);
  const isFree = !course.price || course.price === 0;

  return (
    <>
      <div className="bg-brand-soft/70 dark:bg-brand-darkSoft/60 border border-brand-border dark:border-brand-darkBorder rounded-[14px] p-4 flex flex-col justify-between shadow-sm hover:border-brand-focus/40 transition-all duration-200 group">
        <div>
          {/* Course Thumbnail */}
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-brand-border/40">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Category Tag */}
            <span className="absolute top-2.5 left-2.5 bg-brand-navy/85 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {course.category}
            </span>
          </div>

          {/* Chips: Lessons count & Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white dark:bg-brand-darkBg border border-brand-border dark:border-brand-darkBorder text-brand-muted dark:text-brand-darkText px-2 py-0.5 rounded-full">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {course.lessons.length} Lessons
            </span>

            {isFree ? (
              <span className="text-[11px] font-bold bg-brand-success/15 text-brand-success px-2 py-0.5 rounded-full">
                Free
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                Rs. {course.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Title & Teacher */}
          <h3 className="font-bold text-sm text-brand-text dark:text-brand-darkText line-clamp-1 mb-1 group-hover:text-brand-focus transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-brand-muted dark:text-brand-darkText/70 line-clamp-2 mb-3">
            {course.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-brand-muted dark:text-brand-darkText/80 mb-4">
            <img
              src={course.teacher.avatar}
              alt={course.teacher.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="truncate">{course.teacher.name}</span>
          </div>
        </div>

        {/* Action Area */}
        <div className="pt-2 border-t border-brand-border/60 dark:border-brand-darkBorder/60">
          {enrolled ? (
            <div>
              <div className="mb-2.5">
                <ProgressBar progress={progress} size="sm" />
              </div>
              <Link
                href={`/courses/${course.id}`}
                className="w-full block text-center py-2 px-3 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {progress > 0 ? 'Continue Learning' : 'Start Course'}
              </Link>
            </div>
          ) : (
            <div>
              {isFree ? (
                <button
                  type="button"
                  onClick={() => enrollFree(course.id)}
                  className="w-full py-2 px-3 rounded-[10px] bg-brand-success hover:bg-brand-success/90 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Enroll Free
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-2 px-3 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Buy · Rs. {course.price.toLocaleString()}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal for Paid Courses */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        course={course}
      />
    </>
  );
}
