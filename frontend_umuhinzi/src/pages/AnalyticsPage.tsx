import { useEffect, useState } from "react";
import { farmerApi, type FarmerCreditScore } from "../api/farmer";

const factorCards = [
  {
    title: "Repayment Reliability",
    description: "Consistency of on-time loan repayments over time.",
    impact: "High",
    level: "Core",
  },
  {
    title: "Agricultural Productivity",
    description: "Yield performance relative to your farm records.",
    impact: "High",
    level: "Core",
  },
  {
    title: "Tenure & Stability",
    description: "Duration of farming activities on registered land parcels.",
    impact: "Medium",
    level: "Supporting",
  },
  {
    title: "Market Engagement",
    description: "Active participation in cooperatives and markets.",
    impact: "Medium",
    level: "Supporting",
  },
];

export const AnalyticsPage = () => {
  const [creditScore, setCreditScore] = useState<FarmerCreditScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setCreditScore(await farmerApi.getLatestCreditScore().catch(() => null));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerateCreditScore = async () => {
    setGenerating(true);
    try {
      const score = await farmerApi.generateCreditScore();
      setCreditScore(score);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading credit score...</div>;
  }

  const score = creditScore?.score ?? 0;
  const risk = creditScore?.riskLevel || creditScore?.grade || "Pending";
  const hasCreditScore = creditScore !== null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Credit Analysis</h2>
          <p className="mt-2 text-sm text-stone-500">Detailed breakdown of your live backend credit score and agricultural reputation.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">View History</button>
          <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Apply for Credit</button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.65fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)]">
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-panel">
              <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-stone-100 border-t-stone-800 bg-white">
                  <div className="text-center">
                    <p className="text-4xl font-semibold text-stone-900">{hasCreditScore ? score : "No score yet"}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Trust Score</p>
                  </div>
                </div>

                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold text-stone-900">{risk}</h3>
                  <p className="mt-3 text-sm text-stone-600">This score is returned from the backend credit score service for your authenticated account.</p>
                  <div className="mt-4 space-y-2 text-sm text-stone-700">
                    <p><span className="font-semibold">Latest score ID:</span> {creditScore?.id || "-"}</p>
                    <p><span className="font-semibold">Generated:</span> {creditScore?.createdAt ? new Date(creditScore.createdAt).toLocaleDateString() : "-"}</p>
                    <p><span className="font-semibold">Summary:</span> {creditScore?.summary || "No summary available"}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm"
                      onClick={() => void handleGenerateCreditScore()}
                      disabled={generating}
                    >
                      {generating ? "Generating..." : creditScore ? "Refresh credit score" : "Generate credit score"}
                    </button>
                    <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm">Live score from backend</button>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">Instant Insights</h3>
                  <p className="mt-1 text-sm text-stone-500">Recommendations based on your backend profile</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Update Records</span>
              </div>

              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Recommended action</p>
                <p className="mt-2 text-sm text-stone-700">Use the recommendations page to review the latest actions generated by the backend.</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-stone-900">Your Benefits</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Live score returned from the credit-score API</li>
                  <li>Recent backend score history can be loaded later</li>
                  <li>Use analytics before applying for a loan</li>
                </ul>
              </div>
            </article>
          </div>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-stone-900">Score Factor Analysis</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {factorCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-stone-900">{card.title}</h4>
                      <p className="mt-2 text-sm text-stone-500">{card.description}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{card.level}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
                    <span className="text-stone-500">Impact: <span className="font-semibold text-stone-700">{card.impact}</span></span>
                    <button className="font-semibold text-brand-600">Learn More →</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-900">Productivity Analytics</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Yield vs Regional</span>
              </div>
              <div className="mt-5 flex h-64 items-end gap-4 rounded-2xl bg-stone-50 p-4">
                <div className="flex flex-1 items-end justify-center gap-3">
                  <div className="w-8 rounded-t-lg bg-brand-500" style={{ height: "62%" }} />
                  <div className="w-8 rounded-t-lg bg-stone-600" style={{ height: "54%" }} />
                </div>
                <div className="flex flex-1 items-end justify-center gap-3">
                  <div className="w-8 rounded-t-lg bg-brand-500" style={{ height: "70%" }} />
                  <div className="w-8 rounded-t-lg bg-stone-600" style={{ height: "56%" }} />
                </div>
                <div className="flex flex-1 items-end justify-center gap-3">
                  <div className="w-8 rounded-t-lg bg-brand-500" style={{ height: "58%" }} />
                  <div className="w-8 rounded-t-lg bg-stone-600" style={{ height: "52%" }} />
                </div>
                <div className="flex flex-1 items-end justify-center gap-3">
                  <div className="w-8 rounded-t-lg bg-brand-500" style={{ height: "82%" }} />
                  <div className="w-8 rounded-t-lg bg-stone-600" style={{ height: "57%" }} />
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs text-stone-500">
                <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" />Your Yield</span>
                <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-stone-600" />Regional Average</span>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-900">Repayment Consistency</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Last 6 months</span>
              </div>
              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <svg viewBox="0 0 300 180" className="h-64 w-full">
                  <path d="M10 140 L60 100 L110 58 L160 135 L210 95 L260 45 L290 20" fill="none" stroke="#22c55e" strokeWidth="3" />
                  <path d="M10 160 L60 125 L110 96 L160 100 L210 92 L260 80 L290 48" fill="none" stroke="#fb923c" strokeWidth="3" />
                  {[10, 60, 110, 160, 210, 260, 290].map((x) => (
                    <circle key={x} cx={x} cy={x === 10 ? 140 : x === 60 ? 100 : x === 110 ? 58 : x === 160 ? 135 : x === 210 ? 95 : x === 260 ? 45 : 20} r="3" fill="#22c55e" />
                  ))}
                </svg>
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs text-stone-500">
                <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" />Repayment Rate (%)</span>
              </div>
            </article>
          </section>

          <section className="rounded-[1.75rem] border border-brand-500 bg-brand-500 p-6 text-white shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Unlock the Next Tier</h3>
                <p className="mt-2 max-w-2xl text-sm text-brand-50">By maintaining your current productivity and repaying your upcoming seasonal loan by December 15th, you are projected to reach a score of 780. This will unlock our 0% processing fee tier.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700">View Payment Schedule</button>
                  <button className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">Learn About Training</button>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 px-6 py-4 text-center">
                <div className="text-4xl font-semibold">+38 pts</div>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-brand-50">Projected Growth</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Key Takeaways</h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li className="rounded-2xl bg-stone-50 p-4">Consistent repayment history remains your strongest score driver.</li>
              <li className="rounded-2xl bg-stone-50 p-4">Add recent yield and livestock records to strengthen your profile.</li>
              <li className="rounded-2xl bg-stone-50 p-4">Maintain on-time payments to keep access to the Elite Farmer tier.</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Need Help?</h3>
            <p className="mt-2 text-sm text-stone-500">A support team member can explain how this score affects your loan eligibility and rates.</p>
            <button className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Contact Support</button>
          </article>
        </aside>
      </section>
    </div>
  );
};
