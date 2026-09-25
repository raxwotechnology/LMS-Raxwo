'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStudent } from '@/context/StudentContext';

export default function QuizModal({ isOpen, onClose, course }) {
  const { submitQuiz } = useStudent();
  const quiz = course?.quiz;

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !quiz) return null;

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let calculatedScore = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    // Record result in student context / results table
    submitQuiz(course.id, course.title, quiz.title, calculatedScore, quiz.questions.length);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  const percentage = Math.round((score / quiz.questions.length) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border dark:border-brand-darkBorder mb-4">
          <div>
            <h3 id="quiz-modal-title" className="text-base font-bold text-brand-text dark:text-brand-darkText">
              {quiz.title}
            </h3>
            <p className="text-xs text-brand-muted dark:text-brand-darkText/60">
              {course.title} · {quiz.questions.length} Questions
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-brand-muted hover:text-brand-text dark:hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {isSubmitted ? (
            /* Score Summary View */
            <div className="text-center py-4">
              <div
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center font-bold text-2xl mb-3 shadow-inner ${
                  percentage >= 75
                    ? 'bg-brand-success/15 text-brand-success'
                    : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {percentage}%
              </div>

              <h4 className="text-lg font-bold text-brand-text dark:text-brand-darkText mb-1">
                {percentage >= 75 ? 'Excellent Work!' : 'Review & Practice Again'}
              </h4>
              <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mb-4">
                You answered {score} out of {quiz.questions.length} questions correctly.
                Your mark has been saved to your results transcript.
              </p>

              {/* Detailed Breakdown */}
              <div className="space-y-4 text-left mt-6">
                {quiz.questions.map((q, qIdx) => {
                  const isCorrect = selectedAnswers[qIdx] === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        isCorrect
                          ? 'border-brand-success/30 bg-brand-success/5'
                          : 'border-brand-error/30 bg-brand-error/5'
                      }`}
                    >
                      <p className="font-semibold text-brand-text dark:text-white mb-2">
                        {qIdx + 1}. {q.question}
                      </p>
                      <p className="text-brand-muted mb-1">
                        Your answer:{' '}
                        <span className={isCorrect ? 'text-brand-success font-bold' : 'text-brand-error font-bold'}>
                          {q.options[selectedAnswers[qIdx]] || 'Not answered'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-brand-success font-medium mb-1">
                          Correct answer: {q.options[q.correctIndex]}
                        </p>
                      )}
                      <p className="text-[11px] text-brand-muted italic mt-1.5 pt-1.5 border-t border-brand-border/40">
                        Explanation: {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Question Form */
            <form id="quiz-form" onSubmit={handleSubmit} className="space-y-6">
              {quiz.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-2.5">
                  <p className="text-xs font-bold text-brand-text dark:text-brand-darkText leading-relaxed">
                    <span className="text-brand-focus mr-1">Q{qIdx + 1}.</span> {q.question}
                  </p>

                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-focus bg-brand-focus/10 dark:bg-brand-focus/20 font-semibold text-brand-navy dark:text-white'
                              : 'border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText hover:border-brand-focus/30'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-brand-focus bg-brand-focus text-white text-[10px]'
                                : 'border-brand-border'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-brand-border dark:border-brand-darkBorder flex justify-end gap-2 shrink-0">
          {isSubmitted ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="py-2.5 px-4 rounded-[10px] border border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText text-xs font-semibold hover:border-brand-focus"
              >
                Retake Quiz
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-[10px] border border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText text-xs font-semibold hover:border-brand-focus"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quiz-form"
                disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                className="py-2.5 px-5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
              >
                Submit Answers
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
