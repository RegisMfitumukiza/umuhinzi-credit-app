import { useEffect, useState } from "react";
import { farmerApi, type FarmerRecommendation } from "../api/farmer";

export const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState<FarmerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setRecommendations(await farmerApi.getRecommendations(20));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading recommendations...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-stone-900">Recommendations</h2>
        <p className="mt-2 text-sm text-stone-600">Crop and input recommendations from the backend.</p>
      </section>

      <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-panel">
        {recommendations.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">No recommendations yet.</p>
        ) : (
          recommendations.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-stone-900">{item.title || item.type || "Recommendation"}</h3>
                  <p className="mt-1 text-sm text-stone-500">{item.message || "Review this recommendation from the backend."}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.priority || "LOW"}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
