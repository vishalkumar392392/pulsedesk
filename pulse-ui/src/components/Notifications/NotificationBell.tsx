import { useEffect, useRef, useState } from "react";
import { MdDoneAll, MdNotificationsNone } from "react-icons/md";
import { useNavigate } from "react-router";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../../services/notifications/notificationApi";
import type { Notification } from "../../types/notification";

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(
    undefined,
    {
      pollingInterval: 15_000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const {
    data: notificationsPage,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(undefined, {
    skip: !isOpen,
    pollingInterval: 15_000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsReadMutation();
  const notifications = notificationsPage?.content ?? [];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      void markNotificationRead(notification.id);
    }
    setIsOpen(false);
    navigate(
      `/tickets/${notification.ticketId}#comment-${notification.commentId}`,
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      // The background API error handler remains responsible for server errors.
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 focus:ring-2 focus:ring-teal-200 focus:outline-none"
      >
        <MdNotificationsNone aria-hidden="true" size={25} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs leading-5 font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                className="text-blaze-haze-700 flex cursor-pointer items-center gap-1 text-sm font-semibold disabled:cursor-wait disabled:opacity-50"
              >
                <MdDoneAll aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <p className="px-5 py-8 text-center text-gray-500">
                Loading notifications…
              </p>
            )}
            {isError && (
              <div className="px-5 py-8 text-center text-red-700">
                <p>Unable to load notifications.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 cursor-pointer font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            {!isLoading && !isError && notifications.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-500">
                No notifications yet.
              </p>
            )}
            {!isError &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => openNotification(notification)}
                  className={`flex w-full cursor-pointer gap-3 border-b border-gray-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-gray-50 ${
                    notification.read ? "bg-white" : "bg-teal-50/70"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 size-2 shrink-0 rounded-full ${
                      notification.read ? "bg-transparent" : "bg-red-600"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm leading-5 text-gray-800">
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
