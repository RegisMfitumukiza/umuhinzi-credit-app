import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";
import type { Recommendation } from "../types";

const priorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT": return "border-red-300 bg-red-50";
    case "HIGH": return "border-orange-300 bg-orange-50";
    case "MEDIUM": return "border-yellow-300 bg-yellow-50";
    default: return "border-stone-200 bg-white";
  }
};

const priorityBadge = (priority: string) => {
  switch (priority) {
    case "URGENT": return "bg-red-100 text-red-700";
    case "HIGH": return "bg-orange-100 text-orange-700";
    case "MEDIUM": return "bg-yellow-100 text-yellow-700";
    default: return "bg-stone-100 text-stone-500";
  }
};

export const RecommendationsPage = () => {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/recommendations")
      .then((r) => setRecommendations(r.data.data.recommendations ?? []))
      .catch(() => showToast("Failed to load recommendations.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/recommendations/${id}/read`);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true, status: "READ" as const } : r))
      );
    } catch {
      // fail silently
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Recommendations</h1>
        <p className="text-stone-500 text-sm mt-0.5">Advice from the Umuhinzi team</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No recommendations yet</p>
          <p className="text-stone-400 text-sm mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => !rec.isRead && markRead(rec.id)}
              className={`rounded-2xl border p-5 cursor-pointer transition-all ${priorityColor(rec.priority)} ${
                !rec.isRead ? "shadow-sm hover:shadow-md" : "opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!rec.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityBadge(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs text-stone-400">{rec.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="font-semibold text-stone-900">{rec.title}</p>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{rec.message}</p>
                  {rec.actionUrl && rec.actionLabel && (
                    <a
                      href={rec.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-brand-600 font-semibold hover:underline mt-2 inline-block"
                    >
                      {rec.actionLabel} →
                    </a>
                  )}
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(rec.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
