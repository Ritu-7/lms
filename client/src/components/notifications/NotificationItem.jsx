import React from "react";

// ── Relative time formatter ──────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ── Icon background color by type ────────────────────────────────────────────
const TYPE_STYLES = {
  enrollment: "bg-green-100 text-green-600",
  payment: "bg-purple-100 text-purple-600",
  certificate: "bg-yellow-100 text-yellow-600",
  assignment: "bg-orange-100 text-orange-600",
  quiz: "bg-cyan-100 text-cyan-600",
  announcement: "bg-red-100 text-red-600",
  course: "bg-blue-100 text-blue-600",
  AI: "bg-indigo-100 text-indigo-600",
  system: "bg-gray-100 text-gray-600",
};

/**
 * NotificationItem — reusable notification row.
 *
 * Props:
 *  - notification: { _id, title, message, type, priority, isRead, icon, actionUrl, createdAt, senderLabel }
 *  - onMarkRead(id)
 *  - onDelete(id)
 *  - onNavigate(url)
 *  - compact (boolean, for dropdown)
 */
const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
  compact = false,
}) => {
  const {
    _id,
    title,
    message,
    type = "system",
    priority,
    isRead,
    icon,
    actionUrl,
    createdAt,
  } = notification;

  const iconStyle = TYPE_STYLES[type] || TYPE_STYLES.system;

  const handleClick = () => {
    if (!isRead && onMarkRead) onMarkRead(_id);
    if (actionUrl && onNavigate) onNavigate(actionUrl);
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    if (onMarkRead) onMarkRead(_id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(_id);
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-3 ${compact ? "p-2.5" : "p-3.5"} rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 border-l-4 ${
        isRead ? "bg-white border-transparent" : "bg-blue-50/40 border-blue-500"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 flex items-center justify-center rounded-full text-base ${
          compact ? "w-8 h-8" : "w-10 h-10"
        } ${iconStyle}`}
      >
        {icon || "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={`font-semibold text-gray-800 truncate ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {title}
          </p>
          {priority === "high" && (
            <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
        <p
          className={`text-gray-500 mt-0.5 ${
            compact ? "text-[11px] line-clamp-1" : "text-xs line-clamp-2"
          }`}
        >
          {message}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-gray-400">{timeAgo(createdAt)}</span>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {!isRead && (
              <button
                onClick={handleMarkRead}
                title="Mark as read"
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              </button>
            )}
            {!compact && (
              <button
                onClick={handleDelete}
                title="Delete"
                className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
