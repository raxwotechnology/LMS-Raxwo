'use client';

import React, { useState } from 'react';
import { useStudent } from '@/context/StudentContext';
import CourseCard from '@/components/student/CourseCard';
import CheckoutModal from '@/components/student/CheckoutModal';

export default function CoursesPage() {
  const {
    courses,
    isEnrolled,
    enrollCourse,
    processPayment,
  } = useStudent();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);

  // Filter courses based on active tab
  const filteredCourses = courses.filter((course) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 dark:border-brand-darkBorder/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text dark:text-white tracking-tight">
            Course Catalog
          </h1>
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70 mt-1">
            Browse our wide selection of certified courses and elevate your skills.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-brand-soft dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text dark:hover:text-white'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('free')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'free'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text dark:hover:text-white'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paid')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'paid'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text dark:hover:text-white'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-brand-darkSoft rounded-[14px] border border-brand-border dark:border-brand-darkBorder">
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70">
            No courses found under this category.
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

      {/* Checkout Modal for Paid Courses */}
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
