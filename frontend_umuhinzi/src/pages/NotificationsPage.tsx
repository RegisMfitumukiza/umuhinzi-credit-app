import { useEffect, useState } from "react";
import { farmerApi, type FarmerNotification } from "../api/farmer";

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setNotifications(await farmerApi.getNotifications(20));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Notifications</h2>
          <p className="mt-2 text-sm text-stone-600">System messages and alerts.</p>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-panel">
        {notifications.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <article key={notification.id} className="rounded-2xl border border-stone-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-stone-900">{notification.title || "Notification"}</h3>
                  <p className="mt-1 text-sm text-stone-500">{notification.message || "New activity from your account."}</p>
                </div>
                <span className={notification.isRead ? "rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500" : "rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"}>
                  {notification.isRead ? "Read" : "New"}
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
