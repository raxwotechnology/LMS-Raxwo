import React from 'react';
import { Link } from 'react-router-dom';

export default function CourseCard({ course, isEnrolled, onEnrollFree, onEnrollPaid }) {
  const isFree = course.price === 0;

  return (
    <div className="rounded-[14px] bg-white border border-brand-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Course Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-brand-soft">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80';
            }}
          />
          {isEnrolled && (
            <div className="absolute top-3 right-3 bg-brand-success text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              ✓ Enrolled
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-focus px-2.5 py-0.5 rounded-full bg-brand-focus/10">
              {course.category}
            </span>
            <span className="text-xs font-bold text-brand-navy">
              {isFree ? 'FREE' : `Rs. ${course.price.toLocaleString()}`}
            </span>
          </div>

          <h3 className="text-base font-bold text-brand-text line-clamp-1 group-hover:text-brand-navy transition-colors">
            {course.title}
          </h3>

          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
            <span>{course.lessonCount || course.lessons?.length || 0} Lessons</span>
            <span>{course.duration}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0">
        {isEnrolled ? (
          <Link
            to={`/courses/${course.id}`}
            className="w-full py-2.5 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>Go to Course</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        ) : isFree ? (
          <button
            type="button"
            onClick={() => onEnrollFree(course.id)}
            className="w-full py-2.5 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Enroll Free
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onEnrollPaid(course)}
            className="w-full py-2.5 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Enroll Now &bull; Rs. {course.price.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}
