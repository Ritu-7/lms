import React from "react";
import { Link } from "react-router-dom";
import NotificationItem from "./NotificationItem";

// ── Loading skeleton ─────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-start gap-3 p-3 animate-pulse">
    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-2.5 bg-gray-200 rounded w-full" />
      <div className="h-2 bg-gray-200 rounded w-1/4" />
    </div>
  </div>
);

/**
 * NotificationDropdown — the dropdown panel beneath the bell icon.
 */
const NotificationDropdown = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNavigate,
  isLoading,
}) => {
  if (!isOpen) return null;

  const displayItems = notifications.slice(0, 10);

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden
        transform transition-all duration-200 origin-top-right animate-in"
      style={{ animationName: "dropdown-enter", animationDuration: "200ms" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto max-h-[360px] divide-y divide-gray-50">
        {isLoading && notifications.length === 0 ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-300 mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          displayItems.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onNavigate={(url) => {
                if (onNavigate) onNavigate(url);
                if (onClose) onClose();
              }}
              compact
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium text-center block transition-colors"
        >
          View All Notifications
        </Link>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes dropdown-enter {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
