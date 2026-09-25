'use client';

import React from 'react';

export default function Tabs({ tabs = [], activeTab, onTabChange, ariaLabel = 'Navigation Tabs' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2 p-1 bg-brand-soft dark:bg-brand-darkSoft/80 border border-brand-border dark:border-brand-darkBorder rounded-xl select-none"
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const label = typeof tab === 'string' ? tab : tab.label;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-focus/30 ${
              isActive
                ? 'bg-brand-navy text-white shadow-sm dark:bg-brand-focus'
                : 'text-brand-muted dark:text-brand-darkText/70 hover:text-brand-text dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-border dark:bg-brand-darkBorder text-brand-muted dark:text-brand-darkText'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
