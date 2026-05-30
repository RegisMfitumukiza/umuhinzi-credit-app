import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatRelativeTime } from "../utils/format";
import type { Notification } from "../types";

const priorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT": return "bg-red-100 text-red-700";
    case "HIGH": return "bg-orange-100 text-orange-700";
    case "MEDIUM": return "bg-yellow-100 text-yellow-700";
    default: return "bg-stone-100 text-stone-500";
  }
};

export const NotificationsPage = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    api
      .get("/notifications?limit=50")
      .then((r) => setNotifications(r.data.data.notifications ?? []))
      .catch(() => showToast("Failed to load notifications.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // fail silently
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      showToast("Failed to mark all as read.", "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="text-sm text-brand-600 font-semibold hover:underline disabled:opacity-60"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No notifications yet</p>
          <p className="text-stone-400 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                n.isRead
                  ? "border-stone-100 opacity-70"
                  : "border-brand-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor(n.priority)}`}>
                      {n.priority}
                    </span>
                    <span className="text-xs text-stone-400 truncate">
                      {n.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-stone-800">{n.title}</p>
                  <p className="text-sm text-stone-500 mt-0.5">{n.message}</p>
                  {n.actionUrl && (
                    <a
                      href={n.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-brand-600 font-semibold hover:underline mt-1 inline-block"
                    >
                      View details →
                    </a>
                  )}
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
