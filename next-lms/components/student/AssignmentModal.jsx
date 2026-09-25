'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStudent } from '@/context/StudentContext';

export default function AssignmentModal({ isOpen, onClose, course }) {
  const { submitAssignment } = useStudent();
  const assignment = course?.assignment;

  const [selectedFile, setSelectedFile] = useState(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  if (!isOpen || !assignment) return null;

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to submit.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitAssignment(
        course.id,
        course.title,
        assignment.title,
        selectedFile.name,
        note
      );
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border dark:border-brand-darkBorder mb-4">
          <div>
            <h3 id="assignment-modal-title" className="text-base font-bold text-brand-text dark:text-brand-darkText">
              Submit Assignment
            </h3>
            <p className="text-xs text-brand-muted dark:text-brand-darkText/60">
              {course.title}
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

        {/* Assignment Information */}
        <div className="bg-brand-soft/70 dark:bg-brand-darkBg/60 p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder mb-4 text-xs">
          <h4 className="font-bold text-brand-text dark:text-white mb-1">
            {assignment.title}
          </h4>
          <p className="text-brand-muted dark:text-brand-darkText/70 mb-2">
            {assignment.description}
          </p>
          <div className="flex justify-between font-semibold text-[11px] pt-2 border-t border-brand-border/60">
            <span>Due Date: {assignment.dueDate}</span>
            <span>Total Marks: {assignment.totalMarks}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Input */}
          <div>
            <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1.5">
              Upload Work (PDF, DOCX, ZIP)
            </label>
            <div className="border-2 border-dashed border-brand-border dark:border-brand-darkBorder hover:border-brand-focus rounded-xl p-4 text-center bg-white dark:bg-brand-darkBg cursor-pointer transition-colors relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.zip,.rar"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-brand-focus mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {selectedFile ? (
                  <span className="text-xs font-bold text-brand-navy dark:text-brand-focus truncate max-w-xs">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-brand-text dark:text-white">
                      Click or drag file to upload
                    </span>
                    <span className="text-[10px] text-brand-muted mt-0.5">
                      Maximum file size: 25MB
                    </span>
                  </>
                )}
              </div>
            </div>
            {error && <p role="alert" className="text-xs text-brand-error mt-1">{error}</p>}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1">
              Submission Note <span className="text-brand-muted font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any comments for the instructor..."
              className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder p-2.5 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-white focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 outline-none transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-[10px] border border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText text-xs font-semibold hover:border-brand-focus"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover disabled:opacity-70 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Assignment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
