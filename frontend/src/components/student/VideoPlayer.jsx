import React, { useState, useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';

export default function VideoPlayer({ courseId, activeLesson }) {
  const { isLessonCompleted, toggleLessonComplete } = useStudent();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  const completed = activeLesson ? isLessonCompleted(courseId, activeLesson.id) : false;

  useEffect(() => {
    setIsPlaying(false);
    setProgress(completed ? 100 : 20);
  }, [activeLesson?.id, completed]);

  if (!activeLesson) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-black/90 flex items-center justify-center text-white/60 text-sm">
        Select a lesson to begin learning
      </div>
    );
  }

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleToggleComplete = () => {
    toggleLessonComplete(courseId, activeLesson.id);
  };

  return (
    <div className="w-full space-y-3">
      {/* 16:9 Video Player Container */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-brand-navy shadow-lg border border-brand-navy/30 group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 flex flex-col justify-between p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <span className="bg-brand-bannerChipBg text-brand-bannerChipText text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              Lesson {activeLesson.order}: {activeLesson.title}
            </span>
            <span className="text-white text-xs font-mono font-semibold bg-black/40 px-2 py-0.5 rounded">
              {activeLesson.duration || '14:32'}
            </span>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause lesson video' : 'Play lesson video'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white text-brand-navy flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div
                style={{ width: `${progress}%` }}
                className="bg-brand-focus h-full rounded-full transition-all duration-200"
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/70">
              <span>{isPlaying ? '03:45' : '00:00'}</span>
              <span>{activeLesson.duration || '14:32'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-brand-soft border border-brand-border">
        <div>
          <h4 className="text-xs font-bold text-brand-text">
            Lesson Completion Status
          </h4>
          <p className="text-[11px] text-brand-muted mt-0.5">
            {completed
              ? 'Completed! Counted towards your certificate progress.'
              : 'Mark complete after finishing this module.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleComplete}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            completed
              ? 'bg-brand-success text-white hover:bg-brand-success/90'
              : 'bg-brand-navy text-white hover:bg-brand-navyHover'
          }`}
        >
          {completed ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Completed</span>
            </>
          ) : (
            <span>Mark as Complete</span>
          )}
        </button>
      </div>
    </div>
  );
}
