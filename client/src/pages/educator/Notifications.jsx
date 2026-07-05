import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../../components/notifications/NotificationItem';
import { useNavigate } from 'react-router-dom';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'enrollment', label: 'Enrollments' },
  { id: 'assignment', label: 'Submissions' },
  { id: 'course', label: 'Course Updates' },
  { id: 'announcement', label: 'Admin Announcements' }
];

const EducatorNotifications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    loadMore,
    hasMore
  } = useNotifications();

  // Refetch notifications when the active tab changes
  useEffect(() => {
    const filters = {};
    if (activeTab === 'unread') {
      filters.unread = true;
    } else if (activeTab !== 'all') {
      filters.type = activeTab;
    }
    fetchNotifications(1, filters);
  }, [activeTab, fetchNotifications]);

  const handleNavigate = (url) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-sans">Educator Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor course enrollments, assignment submissions, course approval/rejection status, reviews, and admin announcements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0 || isLoading}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  border-b-2 py-4 px-1 text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-custom-card border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-500">
              <p className="font-semibold">Error loading notifications</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => fetchNotifications(1, activeTab === 'unread' ? { unread: true } : (activeTab !== 'all' ? { type: activeTab } : {}))}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!error && notifications.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No notifications found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                You're all caught up! Student actions and course events will show up here.
              </p>
            </div>
          )}

          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkRead={markRead}
              onDelete={deleteNotification}
              onNavigate={handleNavigate}
            />
          ))}

          {/* Loading state skeleton */}
          {isLoading && (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-start gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 border border-gray-200 rounded-full bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducatorNotifications;
