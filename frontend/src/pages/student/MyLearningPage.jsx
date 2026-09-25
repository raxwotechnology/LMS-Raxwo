import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import ProgressBar from '../../components/student/ProgressBar';

export default function MyLearningPage() {
  const { enrolledCourses } = useStudent();
  const [filter, setFilter] = useState('all');

  const inProgressCourses = enrolledCourses.filter((c) => (c.progress || 0) < 100);
  const completedCourses = enrolledCourses.filter((c) => (c.progress || 0) === 100);

  const displayedCourses = filter === 'in_progress'
    ? inProgressCourses
    : filter === 'completed'
    ? completedCourses
    : enrolledCourses;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            My Learning
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Track your ongoing courses, progress, and completed certifications.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-brand-soft border border-brand-border self-start sm:self-center">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            All ({enrolledCourses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'in_progress'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            In Progress ({inProgressCourses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Completed ({completedCourses.length})
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {displayedCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[14px] border border-brand-border space-y-4 shadow-card">
          <p className="text-sm text-brand-muted">
            {filter === 'completed'
              ? 'You have not completed any courses yet. Keep learning!'
              : 'You are not enrolled in any courses right now.'}
          </p>
          <Link
            to="/courses"
            className="inline-block px-5 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => {
            const completedCount = course.lessons ? course.lessons.filter((l) => l.completed).length : 0;
            const totalCount = course.lessons ? course.lessons.length : (course.lessonCount || 0);

            return (
              <div
                key={course.id}
                className="p-5 rounded-[14px] border border-brand-border bg-white shadow-card hover:border-brand-focus/40 hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-focus px-2.5 py-0.5 rounded-full bg-brand-focus/10">
                      {course.category}
                    </span>
                    {course.progress === 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-success/15 text-brand-success">
                        Completed
                      </span>
                    ) : (
                      <span className="text-[11px] text-brand-muted font-medium">
                        {completedCount} / {totalCount} lessons
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-brand-text mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-brand-muted mb-4 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-brand-border/60">
                  <ProgressBar progress={course.progress || 0} size="sm" />

                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full py-2.5 px-4 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>{course.progress === 100 ? 'Review Course' : 'Continue Learning'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
