import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

type CreditScore = {
  id: string;
  score: number;
  tier: string;
  riskLevel: string;
  maxLoanAmount: number;
  repaymentScore: number;
  farmStabilityScore: number;
  productivityScore: number;
  creditUtilizationScore: number;
  createdAt: string;
};

type FarmerAnalytics = {
  totalLoans: number;
  activeLoans: number;
  totalRepaid: number;
  repaymentRate: number;
  totalFarms: number;
  totalLandSize: number;
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs text-stone-600 mb-1">
      <span>{label}</span>
      <span className="font-semibold">{value ?? 0}/100</span>
    </div>
    <div className="h-2 rounded-full bg-stone-100">
      <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(value ?? 0, 100)}%` }} />
    </div>
  </div>
);

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latest, setLatest] = useState<CreditScore | null>(null);
  const [history, setHistory] = useState<CreditScore[]>([]);
  const [analytics, setAnalytics] = useState<FarmerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [latestRes, historyRes, analyticsRes] = await Promise.allSettled([
          api.get("/v1/credit-scores/latest"),
          api.get("/v1/credit-scores?limit=6"),
          user?.id ? api.get(`/v1/analytics/farmer/${user.id}`) : Promise.reject(),
        ]);
        if (latestRes.status === "fulfilled") setLatest(latestRes.value.data.data ?? null);
        if (historyRes.status === "fulfilled") setHistory(historyRes.value.data.data ?? []);
        if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data.data ?? null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/v1/credit-scores/generate");
      const newScore = res.data.data;
      setLatest(newScore);
      setHistory((prev) => [newScore, ...prev].slice(0, 6));
    } catch {} finally {
      setGenerating(false);
    }
  };

  const scoreColor = !latest ? "text-stone-400" : latest.score >= 700 ? "text-green-600" : latest.score >= 500 ? "text-amber-500" : "text-red-500";
  const riskBadge = !latest ? "bg-stone-100 text-stone-500" : latest.riskLevel === "LOW" ? "bg-green-50 text-green-700" : latest.riskLevel === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  const maxScore = history.length > 0 ? Math.max(...history.map((s) => s.score)) : 1;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Credit Analysis</h2>
          <p className="mt-2 text-sm text-stone-500">Detailed breakdown of your financial trust and agricultural reputation.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={generating} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm disabled:opacity-60">
            {generating ? "Calculating..." : "Recalculate Score"}
          </button>
          <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Apply for Credit</button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.65fr)]">
        <div className="space-y-4">

          {/* Score card */}
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)]">
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-panel flex flex-col items-center justify-center gap-4">
              {loading ? (
                <p className="text-sm text-stone-400">Loading...</p>
              ) : latest ? (
                <>
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-stone-100 border-t-stone-800 bg-white">
                    <div className="text-center">
                      <p className={`text-4xl font-semibold ${scoreColor}`}>{latest.score}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Trust Score</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge}`}>{latest.riskLevel} RISK</span>
                    <p className="mt-2 text-sm font-semibold text-stone-700">Tier: {latest.tier}</p>
                    <p className="mt-1 text-xs text-stone-400">Max Loan: RWF {latest.maxLoanAmount?.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-stone-400 text-sm mb-4">No credit score yet.</p>
                  <button onClick={handleGenerate} disabled={generating} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {generating ? "Generating..." : "Generate Score"}
                  </button>
                </div>
              )}
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel space-y-4">
              <h3 className="text-lg font-semibold text-stone-900">Score Factors</h3>
              {loading ? <p className="text-sm text-stone-400">Loading...</p> : latest ? (
                <div className="space-y-3">
                  <ScoreBar label="Repayment Reliability" value={latest.repaymentScore} />
                  <ScoreBar label="Farm Stability" value={latest.farmStabilityScore} />
                  <ScoreBar label="Productivity" value={latest.productivityScore} />
                  <ScoreBar label="Credit Utilization" value={latest.creditUtilizationScore} />
                </div>
              ) : <p className="text-sm text-stone-400">Generate a score to see factor breakdown.</p>}
            </article>
          </div>

          {/* Loan & repayment stats */}
          {analytics && (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Total Loans", value: analytics.totalLoans },
                { label: "Repayment Rate", value: `${analytics.repaymentRate?.toFixed(1)}%` },
                { label: "Total Repaid", value: `RWF ${analytics.totalRepaid?.toLocaleString()}` },
              ].map((s) => (
                <article key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-900">{s.value}</p>
                </article>
              ))}
            </div>
          )}

          {/* Score history chart */}
          {history.length > 1 && (
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Score History</h3>
              <div className="flex items-end gap-3 h-32">
                {[...history].reverse().map((s, i) => (
                  <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-stone-700">{s.score}</span>
                    <div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${Math.max((s.score / maxScore) * 100, 8)}%` }} />
                    <span className="text-[10px] text-stone-400">{new Date(s.createdAt).toLocaleDateString("en-RW", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Farm Overview</h3>
            {loading ? <p className="mt-3 text-sm text-stone-400">Loading...</p> : analytics ? (
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex justify-between"><span>Registered Farms</span><span className="font-semibold text-stone-900">{analytics.totalFarms}</span></div>
                <div className="flex justify-between"><span>Total Land</span><span className="font-semibold text-stone-900">{analytics.totalLandSize?.toFixed(1)} Ha</span></div>
                <div className="flex justify-between"><span>Active Loans</span><span className="font-semibold text-stone-900">{analytics.activeLoans}</span></div>
              </div>
            ) : <p className="mt-3 text-sm text-stone-400">No data available.</p>}
          </article>

          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Need Help?</h3>
            <p className="mt-2 text-sm text-stone-500">A support team member can explain how this score affects your loan eligibility and rates.</p>
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
              <p className="text-lg font-semibold text-brand-700">0800 123 456</p>
              <p className="mt-1 text-xs text-stone-500">(Toll-Free in Rwanda)</p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};
