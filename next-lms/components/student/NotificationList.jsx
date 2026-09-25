'use client';

import React, { useState } from 'react';

export default function NotificationList({ notifications = [], onMarkRead, onMarkAllRead }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'unread' 
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'class':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 rounded-full bg-brand-success/10 text-brand-success flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'quiz':
      case 'result':
        return (
          <div className="w-10 h-10 rounded-full bg-brand-focus/10 text-brand-focus flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-brand-navy/10 dark:bg-brand-focus/20 text-brand-navy dark:text-brand-focus flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-brand-border dark:border-brand-darkBorder">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-brand-navy text-white'
                : 'bg-brand-soft dark:bg-brand-darkSoft text-brand-muted hover:text-brand-text dark:hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-brand-navy text-white'
                : 'bg-brand-soft dark:bg-brand-darkSoft text-brand-muted hover:text-brand-text dark:hover:text-white'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-brand-badgeRed inline-block" />
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-brand-focus hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-brand-soft dark:bg-brand-darkSoft rounded-[14px] border border-brand-border dark:border-brand-darkBorder">
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onMarkRead && onMarkRead(item.id)}
              className={`p-4 rounded-[14px] border transition-all cursor-pointer flex items-start gap-3.5 ${
                item.read
                  ? 'bg-white dark:bg-brand-darkSoft border-brand-border/70 dark:border-brand-darkBorder/70 opacity-80 hover:opacity-100'
                  : 'bg-brand-soft/80 dark:bg-brand-darkSoft border-brand-focus/40 shadow-sm hover:border-brand-focus'
              }`}
            >
              {getNotificationIcon(item.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold truncate ${item.read ? 'text-brand-text dark:text-brand-darkText' : 'text-brand-navy dark:text-white font-bold'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-brand-muted dark:text-brand-darkText/60 shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-badgeRed shrink-0 mt-1.5 ring-2 ring-white dark:ring-brand-darkSoft" title="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
