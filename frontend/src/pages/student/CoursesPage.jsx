import React, { useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import CourseCard from '../../components/student/CourseCard';
import CheckoutModal from '../../components/student/CheckoutModal';

export default function CoursesPage() {
  const {
    courses,
    isEnrolled,
    enrollCourse,
    processPayment,
  } = useStudent();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery.trim() ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'free') return course.price === 0;
    if (activeTab === 'paid') return course.price > 0;
    return true;
  });

  const handleEnrollPaid = (course) => {
    setSelectedCourseForCheckout(course);
  };

  const handleCompleteCheckout = (paymentDetails) => {
    if (selectedCourseForCheckout) {
      processPayment(selectedCourseForCheckout, paymentDetails);
      setSelectedCourseForCheckout(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            All Subjects
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Browse all official subjects and courses offered by Wisdom Institute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search subjects or lecturers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-56 px-3 py-1.5 pl-8 rounded-full border border-brand-border bg-white text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20 transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-brand-muted hover:text-brand-text font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-brand-soft border border-brand-border self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              All Subjects ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('free')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'free'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'paid'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              Paid
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[14px] border border-brand-border space-y-2">
          <p className="text-base font-semibold text-brand-text">
            {courses.length === 0
              ? 'No subjects added by admin yet.'
              : 'No subjects match your search or filter.'}
          </p>
          <p className="text-xs text-brand-muted">
            {courses.length === 0
              ? 'Subjects added by the administrator in the Admin Portal will appear here automatically.'
              : 'Try clearing your search query or selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={isEnrolled(course.id)}
              onEnrollFree={enrollCourse}
              onEnrollPaid={handleEnrollPaid}
            />
          ))}
        </div>
      )}

      {selectedCourseForCheckout && (
        <CheckoutModal
          course={selectedCourseForCheckout}
          onClose={() => setSelectedCourseForCheckout(null)}
          onSuccess={handleCompleteCheckout}
        />
      )}
    </div>
  );
}
