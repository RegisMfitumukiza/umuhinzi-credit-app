import { useEffect, useState } from "react";
import { api } from "../api/http";

type Recommendation = { id: string; title: string; description: string; category: string; priority: string; createdAt: string };

const priorityColor: Record<string, string> = {
  HIGH: "bg-red-50 text-red-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-green-50 text-green-700",
};

export const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/v1/recommendations/me")
      .then((res) => setRecommendations(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900">Recommendations</h2>
        <p className="mt-1 text-sm text-stone-500">Personalized crop and input recommendations based on your farm data.</p>
      </div>

      {loading ? <p className="text-sm text-stone-400">Loading recommendations...</p> : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">
          No recommendations yet. Add farm and crop data to receive personalized insights.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((rec) => (
            <article key={rec.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold text-stone-900">{rec.title}</h4>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${priorityColor[rec.priority] ?? "bg-stone-100 text-stone-600"}`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{rec.description}</p>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">{rec.category}</span>
                <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
