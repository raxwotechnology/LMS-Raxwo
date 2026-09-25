import React from 'react';
import { useStudent } from '../../context/StudentContext';

export default function LessonList({ courseId, lessons = [], activeLessonId, onSelectLesson }) {
  const { isLessonCompleted, toggleLessonComplete } = useStudent();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1 mb-2">
        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider">
          Curriculum ({lessons.length} Lessons)
        </h3>
      </div>

      <div className="space-y-1.5">
        {lessons.map((lesson) => {
          const isCompleted = isLessonCompleted(courseId, lesson.id);
          const isActive = activeLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className={`flex items-center justify-between p-3 rounded-[12px] border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-brand-navy/5 border-brand-focus/50 shadow-xs'
                  : 'bg-white border-brand-border hover:border-brand-focus/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLessonComplete(courseId, lesson.id);
                  }}
                  className="shrink-0 p-0.5"
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-brand-success text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-brand-border hover:border-brand-focus" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-muted">
                      {lesson.order}.
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-brand-navy font-bold' : 'text-brand-text'
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    Video &bull; {lesson.duration}
                  </span>
                </div>
              </div>

              {isActive && (
                <span className="w-2 h-2 rounded-full bg-brand-focus shrink-0 ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
