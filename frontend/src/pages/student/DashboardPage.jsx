import React from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import StatCard from '../../components/student/StatCard';
import ProgressBar from '../../components/student/ProgressBar';

export default function DashboardPage() {
  const {
    studentUser,
    enrolledCourses,
    stats,
    classes,
    recordAttendance,
  } = useStudent();

  const studentName = studentUser?.name || 'Student';
  const upcomingClasses = classes.slice(0, 3);
  const inProgressCourses = enrolledCourses.filter((c) => c.progress < 100);
  const completedCourses = enrolledCourses.filter((c) => c.progress === 100);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            {getGreetingTime()}, {studentName}!
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Welcome back to your Wisdom Institute learning portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="px-4 py-2 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>Explore All Subjects</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Subjects"
          value={stats.enrolledCount}
          subtitle={`${completedCourses.length} completed`}
          to="/courses"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatCard
          title="Lessons Completed"
          value={stats.completedLessonsCount}
          subtitle="Keep the momentum"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          subtitle={`${stats.classesAttended} live classes`}
          to="/classes"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Exams"
          value={stats.examsCount ?? 0}
          subtitle="Registered exams"
          to="/exams"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3 3L22 4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">
              Continue Learning
            </h2>
            <Link
              to="/my-learning"
              className="text-xs font-semibold text-brand-focus hover:underline"
            >
              View all ({enrolledCourses.length})
            </Link>
          </div>

          {inProgressCourses.length === 0 ? (
            <div className="p-8 text-center rounded-[14px] border border-brand-border bg-white space-y-3">
              <p className="text-sm text-brand-muted">
                You don't have any in-progress subjects right now.
              </p>
              <Link
                to="/courses"
                className="inline-block px-4 py-2 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
              >
                Browse All Subjects
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 rounded-[14px] border border-brand-border bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-brand-text truncate mt-0.5">
                      {course.title}
                    </h3>
                    <div className="mt-2.5 max-w-sm">
                      <ProgressBar progress={course.progress || 0} size="sm" />
                    </div>
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="px-4 py-2.5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors text-center shrink-0 self-start sm:self-center"
                  >
                    Resume Lesson
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Classes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">
              Upcoming Classes
            </h2>
            <Link
              to="/classes"
              className="text-xs font-semibold text-brand-focus hover:underline"
            >
              Full schedule
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 rounded-[14px] border border-brand-border bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-brand-text">
                      {cls.title}
                    </h4>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {cls.instructor} &bull; {cls.time}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-brand-soft text-brand-navy border border-brand-border shrink-0">
                    {cls.date}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-brand-border/60 flex items-center justify-between gap-2">
                  <span className="text-xs text-brand-muted">
                    {cls.duration}
                  </span>
                  {cls.attended ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-success bg-brand-success/15 px-2.5 py-1 rounded-full">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Attended
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => recordAttendance(cls.id)}
                      className="px-3 py-1 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
                    >
                      Join Class
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
