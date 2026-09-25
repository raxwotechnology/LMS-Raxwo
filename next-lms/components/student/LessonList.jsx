'use client';

import React from 'react';
import { useStudent } from '@/context/StudentContext';

export default function LessonList({ courseId, lessons = [], activeLessonId, onSelectLesson }) {
  const { isLessonCompleted, toggleLessonComplete } = useStudent();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1 mb-2">
        <h3 className="text-xs font-bold text-brand-muted dark:text-brand-darkText/70 uppercase tracking-wider">
          Course Curriculum ({lessons.length} Lessons)
        </h3>
      </div>

      <div className="space-y-1.5">
        {lessons.map((lesson) => {
          const isCompleted = isLessonCompleted(courseId, lesson.id);
          const isActive = activeLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-brand-navy/5 dark:bg-white/5 border-brand-focus/50 shadow-sm'
                  : 'bg-white dark:bg-brand-darkSoft/60 border-brand-border dark:border-brand-darkBorder hover:border-brand-focus/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Complete / Incomplete Checkbox Indicator */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLessonComplete(courseId, lesson.id);
                  }}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className="shrink-0 p-0.5"
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-brand-success text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-brand-border dark:border-brand-darkBorder hover:border-brand-focus" />
                  )}
                </button>

                {/* Lesson Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-muted dark:text-brand-darkText/60">
                      {lesson.order}.
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-brand-navy dark:text-brand-focus font-bold'
                          : isCompleted
                          ? 'text-brand-text dark:text-brand-darkText'
                          : 'text-brand-text dark:text-brand-darkText'
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lesson Duration Badge */}
              <div className="flex items-center gap-2 text-[11px] text-brand-muted dark:text-brand-darkText/60 shrink-0">
                <span>{lesson.duration}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-brand-focus animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
