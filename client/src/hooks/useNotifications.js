import { useContext } from "react";
import { AppContext } from "../context/AppContext";

/**
 * useNotifications — custom hook that acts as a selector for notification context.
 */
export const useNotifications = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useNotifications must be used within AppContextProvider");
  }

  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    notificationsError,
    notificationPage,
    notificationTotalPages,
    hasMoreNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    loadMoreNotifications,
  } = context;

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    fetchNotifications,
    fetchUnreadCount,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    deleteNotification,
    loadMore: loadMoreNotifications,
    hasMore: hasMoreNotifications,
    page: notificationPage,
    totalPages: notificationTotalPages,
  };
};
