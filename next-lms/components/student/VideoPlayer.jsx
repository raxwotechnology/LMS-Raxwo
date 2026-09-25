'use client';

import React, { useState, useEffect } from 'react';
import { useStudent } from '@/context/StudentContext';

export default function VideoPlayer({ courseId, activeLesson }) {
  const { isLessonCompleted, toggleLessonComplete } = useStudent();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  const completed = activeLesson ? isLessonCompleted(courseId, activeLesson.id) : false;

  useEffect(() => {
    // Reset play state when changing active lesson
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
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-brand-navy shadow-lg border border-brand-navy/30 dark:border-brand-darkBorder group">
        {/*
          ======================================================================
          TODO: REAL VIDEO EMBED SWAP POINT
          ----------------------------------------------------------------------
          Replace this placeholder UI with an HTML5 <video> tag or iframe embed:
          <video
            src={activeLesson.videoUrl}
            controls
            className="w-full h-full object-cover"
          />
          Or YouTube / Vimeo iframe:
          <iframe src="https://www.youtube-nocookie.com/embed/..." ... />
          ======================================================================
        */}

        {/* Video Placeholder Simulation */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Badge */}
          <div className="flex justify-between items-center">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
              Lesson {activeLesson.order}: {activeLesson.title}
            </span>
            <span className="text-white/70 text-xs font-mono">
              {activeLesson.duration}
            </span>
          </div>

          {/* Big Center Play / Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center m-auto transition-transform duration-150 hover:scale-110 active:scale-95 shadow-xl"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-8 h-8 fill-white translate-x-0.5" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Bottom Player Controls */}
          <div className="space-y-2">
            {/* Scrubber Progress Bar */}
            <div className="relative w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-brand-focus rounded-full transition-all duration-150"
              />
            </div>

            {/* Bottom Bar: Play/Pause, Time, Resolution */}
            <div className="flex items-center justify-between text-xs text-white/90 font-mono pt-1">
              <div className="flex items-center gap-3">
                <button onClick={handleTogglePlay} className="hover:text-white">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <span>04:12 / {activeLesson.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">1080p HD</span>
                <span className="text-[10px] text-white/60">Demo Player</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Action Bar: Title + Mark Lesson Complete Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-brand-soft/70 dark:bg-brand-darkSoft/60 border border-brand-border dark:border-brand-darkBorder rounded-[14px]">
        <div>
          <h2 className="text-base font-bold text-brand-text dark:text-brand-darkText">
            {activeLesson.order}. {activeLesson.title}
          </h2>
          <p className="text-xs text-brand-muted dark:text-brand-darkText/70">
            Duration: {activeLesson.duration} · High definition video lesson
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleComplete}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold transition-all duration-150 shadow-sm shrink-0 ${
            completed
              ? 'bg-brand-success text-white hover:bg-brand-success/90'
              : 'bg-white dark:bg-brand-darkBg border border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText hover:border-brand-focus'
          }`}
        >
          {completed ? (
            <>
              <span>✓ Completed</span>
              <span className="text-[10px] opacity-75 font-normal">(Undo)</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-brand-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Mark Lesson Complete</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
