'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useStudent } from '@/context/StudentContext';
import VideoPlayer from '@/components/student/VideoPlayer';
import LessonList from '@/components/student/LessonList';
import ProgressBar from '@/components/student/ProgressBar';
import CheckoutModal from '@/components/student/CheckoutModal';

export default function CourseDetailPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const {
    courses,
    isEnrolled,
    enrollCourse,
    processPayment,
    submitQuiz,
    submitAssignment,
    getCourseMaterials,
    getCourseQuiz,
    getCourseAssignment,
    showToast,
  } = useStudent();

  const course = courses.find((c) => c.id === courseId);
  const enrolled = isEnrolled(courseId);

  const [activeTab, setActiveTab] = useState('lessons');
  const [activeLesson, setActiveLesson] = useState(course?.lessons?.[0] || null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Quiz state
  const quiz = getCourseQuiz(courseId);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Assignment state
  const assignment = getCourseAssignment(courseId);
  const [selectedFile, setSelectedFile] = useState(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState(assignment?.status || 'Pending');

  if (!course) {
    return (
      <div className="p-12 text-center bg-white dark:bg-brand-darkSoft rounded-[14px] border border-brand-border dark:border-brand-darkBorder space-y-4">
        <h2 className="text-xl font-bold text-brand-text dark:text-white">Course Not Found</h2>
        <p className="text-sm text-brand-muted dark:text-brand-darkText/70">
          The course you requested does not exist or has been removed.
        </p>
        <Link
          href="/courses"
          className="inline-block px-5 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
        >
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  // If NOT ENROLLED
  if (!enrolled) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-10 rounded-2xl bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder text-center shadow-sm space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-brand-navy/10 dark:bg-white/10 text-brand-navy dark:text-white flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-focus mb-1 block">
            {course.category}
          </span>
          <h1 className="text-2xl font-bold text-brand-text dark:text-white mb-2">
            {course.title}
          </h1>
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70 max-w-md mx-auto">
            {course.description}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-soft dark:bg-brand-darkBg/60 border border-brand-border/60 dark:border-brand-darkBorder/60 flex items-center justify-around text-xs">
          <div>
            <span className="text-brand-muted block">Duration</span>
            <strong className="text-brand-text dark:text-white">{course.duration}</strong>
          </div>
          <div className="border-r border-brand-border dark:border-brand-darkBorder h-6" />
          <div>
            <span className="text-brand-muted block">Lessons</span>
            <strong className="text-brand-text dark:text-white">{course.lessons?.length || 0} Modules</strong>
          </div>
          <div className="border-r border-brand-border dark:border-brand-darkBorder h-6" />
          <div>
            <span className="text-brand-muted block">Price</span>
            <strong className="text-brand-navy dark:text-white font-bold">
              {course.price === 0 ? 'FREE' : `Rs. ${course.price.toLocaleString()}`}
            </strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/courses"
            className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-brand-border dark:border-brand-darkBorder text-brand-muted dark:text-brand-darkText/70 text-xs font-semibold hover:bg-brand-soft transition-colors"
          >
            &larr; Return to Courses
          </Link>

          {course.price === 0 ? (
            <button
              type="button"
              onClick={() => enrollCourse(course.id)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold shadow-md transition-colors"
            >
              Enroll for Free
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold shadow-md transition-colors"
            >
              Enroll Now &bull; Rs. {course.price.toLocaleString()}
            </button>
          )}
        </div>

        {isCheckoutOpen && (
          <CheckoutModal
            course={course}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={(details) => {
              processPayment(course, details);
              setIsCheckoutOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Enrolled course view
  const materials = getCourseMaterials(courseId);

  // Quiz submission handler
  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (!quiz?.questions) return;

    let scoreCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        scoreCount += 1;
      }
    });

    setQuizScore(scoreCount);
    setQuizSubmitted(true);
    submitQuiz(course.id, course.title, quiz.title, scoreCount, quiz.questions.length);
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Assignment submission handler
  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload (.pdf or .docx)');
      return;
    }

    submitAssignment(course.id, assignment.id, {
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      notes: studentNotes,
    });

    setAssignmentStatus('Submitted');
    showToast('Assignment submitted successfully for faculty review!', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-border/60 dark:border-brand-darkBorder/60">
        <div className="flex items-center gap-2 text-xs text-brand-muted dark:text-brand-darkText/60">
          <Link href="/courses" className="hover:text-brand-navy dark:hover:text-white">
            Courses
          </Link>
          <span>/</span>
          <span className="text-brand-text dark:text-white font-medium truncate max-w-[200px] sm:max-w-none">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-success/15 text-brand-success">
            Enrolled
          </span>
          <div className="w-28 sm:w-36">
            <ProgressBar progress={course.progress || 0} size="sm" />
          </div>
        </div>
      </div>

      {/* Main Grid: Video Player on Left, Lessons on Right (on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 16:9 Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer courseId={course.id} activeLesson={activeLesson} />

          <div>
            <h1 className="text-xl font-bold text-brand-text dark:text-white">
              {activeLesson ? activeLesson.title : course.title}
            </h1>
            <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mt-1">
              {course.instructor} &bull; {activeLesson?.duration || course.duration}
            </p>
          </div>
        </div>

        {/* Right 1 Col: Quick Curriculum Drawer */}
        <div className="p-4 rounded-2xl bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder shadow-sm h-fit">
          <LessonList
            courseId={course.id}
            lessons={course.lessons || []}
            activeLessonId={activeLesson?.id}
            onSelectLesson={(lesson) => setActiveLesson(lesson)}
          />
        </div>
      </div>

      {/* Tabs Below Video */}
      <div className="rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSoft p-5 sm:p-6 shadow-sm">
        {/* Tab Headers */}
        <div className="flex flex-wrap gap-2 border-b border-brand-border dark:border-brand-darkBorder pb-3 mb-6" role="tablist">
          {[
            { id: 'lessons', label: 'Lessons', count: course.lessons?.length },
            { id: 'materials', label: 'Materials', count: materials.length },
            { id: 'quiz', label: 'Quiz' },
            { id: 'assignment', label: 'Assignment' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text dark:hover:text-white bg-brand-soft/60 dark:bg-brand-darkBg/60'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: LESSONS */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-text dark:text-white mb-2">
              All Course Lessons & Progress
            </h3>
            <LessonList
              courseId={course.id}
              lessons={course.lessons || []}
              activeLessonId={activeLesson?.id}
              onSelectLesson={(lesson) => setActiveLesson(lesson)}
            />
          </div>
        )}

        {/* TAB 2: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand-text dark:text-white mb-3">
              Downloadable Lecture Materials & Handouts
            </h3>
            {materials.length === 0 ? (
              <p className="text-xs text-brand-muted dark:text-brand-darkText/70 py-4 text-center">
                No materials uploaded for this course yet.
              </p>
            ) : (
              <div className="divide-y divide-brand-border dark:divide-brand-darkBorder">
                {materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-focus/10 text-brand-focus flex items-center justify-center font-bold text-xs shrink-0">
                        {mat.type?.toUpperCase() || 'PDF'}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-brand-text dark:text-white">
                          {mat.title}
                        </h4>
                        <span className="text-[11px] text-brand-muted dark:text-brand-darkText/60">
                          {mat.size} &bull; Added recently
                        </span>
                      </div>
                    </div>

                    <a
                      href={mat.downloadUrl || '#'}
                      download
                      onClick={(e) => {
                        e.preventDefault();
                        showToast(`Downloaded ${mat.title}`, 'info');
                      }}
                      className="px-3.5 py-1.5 rounded-[8px] bg-brand-soft dark:bg-brand-darkBg hover:bg-brand-navy hover:text-white border border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {!quiz ? (
              <p className="text-xs text-brand-muted py-4 text-center">
                No quiz available for this course.
              </p>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-brand-text dark:text-white">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mt-0.5">
                    Answer all questions to test your comprehension. Passing grade is 60%.
                  </p>
                </div>

                {quizSubmitted ? (
                  <div className="p-6 rounded-xl bg-brand-soft dark:bg-brand-darkBg/60 border border-brand-border dark:border-brand-darkBorder text-center space-y-4 animate-fadeIn">
                    <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-brand-success/15 text-brand-success">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-brand-text dark:text-white">
                        Quiz Completed!
                      </h4>
                      <p className="text-sm font-semibold text-brand-focus mt-1">
                        Score: {quizScore} / {quiz.questions.length} ({Math.round((quizScore / quiz.questions.length) * 100)}%)
                      </p>
                      <p className="text-xs text-brand-muted mt-1">
                        Your score has been recorded in your Results profile.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRetakeQuiz}
                      className="px-4 py-2 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
                    >
                      Retake Quiz
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuizSubmit} className="space-y-6">
                    {quiz.questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-4 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-soft/30 dark:bg-brand-darkBg/30 space-y-3"
                      >
                        <p className="text-xs font-bold text-brand-text dark:text-white">
                          Question {qIndex + 1}: {q.question}
                        </p>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => (
                            <label
                              key={optIndex}
                              className="flex items-center gap-3 p-2.5 rounded-lg border border-brand-border/60 dark:border-brand-darkBorder/60 hover:bg-white dark:hover:bg-brand-darkSoft cursor-pointer transition-colors text-xs text-brand-text dark:text-brand-darkText"
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                checked={quizAnswers[qIndex] === optIndex}
                                onChange={() =>
                                  setQuizAnswers((prev) => ({
                                    ...prev,
                                    [qIndex]: optIndex,
                                  }))
                                }
                                className="w-4 h-4 text-brand-navy focus:ring-brand-focus"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                      className="px-6 py-2.5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      Submit Quiz
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ASSIGNMENT */}
        {activeTab === 'assignment' && (
          <div className="space-y-6">
            {!assignment ? (
              <p className="text-xs text-brand-muted py-4 text-center">
                No assignment scheduled for this course.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-brand-text dark:text-white">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mt-1">
                      Due: {assignment.dueDate} &bull; Max Marks: 100
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      assignmentStatus === 'Submitted'
                        ? 'bg-brand-success/15 text-brand-success'
                        : assignmentStatus === 'Graded'
                        ? 'bg-brand-focus/15 text-brand-focus'
                        : 'bg-brand-warning/15 text-brand-warning'
                    }`}
                  >
                    Status: {assignmentStatus}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-brand-soft/50 dark:bg-brand-darkBg/50 border border-brand-border dark:border-brand-darkBorder">
                  <h4 className="text-xs font-bold text-brand-text dark:text-white mb-1">
                    Assignment Prompt:
                  </h4>
                  <p className="text-xs text-brand-muted dark:text-brand-darkText/80 leading-relaxed">
                    {assignment.prompt}
                  </p>
                </div>

                <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-text dark:text-white mb-1.5">
                      Upload Solution File (.pdf, .docx)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-brand-muted file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:bg-brand-navy file:text-white hover:file:bg-brand-navyHover cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-text dark:text-white mb-1.5">
                      Student Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      placeholder="Add any commentary or notes for the faculty grader..."
                      className="w-full rounded-[10px] border border-brand-border dark:border-brand-darkBorder p-3 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText outline-none focus:border-brand-focus"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
                  >
                    Submit Assignment
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
