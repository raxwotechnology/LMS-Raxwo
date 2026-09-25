import React from 'react';
import { useStudent } from '../../context/StudentContext';
import NotificationList from '../../components/student/NotificationList';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStudent();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-brand-border/60">
        <h1 className="text-2xl font-bold text-brand-text tracking-tight">
          Notifications
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Stay updated on your upcoming classes, uploaded lecture notes, assignments, and payments.
        </p>
      </div>

      <NotificationList
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />
    </div>
  );
}
