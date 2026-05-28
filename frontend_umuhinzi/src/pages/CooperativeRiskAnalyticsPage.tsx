import { useEffect, useState } from "react";
import { api } from "../api/http";

type RiskMetrics = {
  totalExposure: number; avgRiskScore: number;
  probabilityOfDefault: number; activeLoans: number;
};
type RegionalRisk = { district: string; riskProfile: string; pd: number };

export const CooperativeRiskAnalyticsPage = () => {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [regional, setRegional] = useState<RegionalRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, regionalRes] = await Promise.allSettled([
          api.get("/v1/analytics/risk-metrics"),
          api.get("/v1/analytics/regional-risk"),
        ]);
        if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value.data.data);
        if (regionalRes.status === "fulfilled") setRegional(regionalRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/v1/exports/risk-report", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "risk-report.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    finally { setExporting(false); }
  };

  const statCards = [
    { label: "Total Exposure", value: metrics ? `RWF ${(metrics.totalExposure / 1_000_000_000).toFixed(1)}B` : "—" },
    { label: "Avg. Risk Score", value: metrics ? `${metrics.avgRiskScore}/100` : "—" },
    { label: "Prob. of Default", value: metrics ? `${metrics.probabilityOfDefault?.toFixed(1)}%` : "—" },
    { label: "Active Loans", value: metrics ? metrics.activeLoans?.toLocaleString() : "—" },
  ];

  const riskColor = (profile: string) =>
    profile === "LOW" ? "text-emerald-600" : profile === "HIGH" ? "text-rose-600" : "text-amber-600";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Risk Assessment Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">Portfolio-wide credit exposure and predictive modeling.</p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
            {exporting ? "Exporting..." : "Export Risk Report"}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((m) => (
            <div key={m.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{m.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : m.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Regional Risk Concentration</h3>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : regional.length === 0 ? (
              <p className="text-sm text-stone-400">No regional data available.</p>
            ) : (
              <div className="space-y-3">
                {regional.map((r) => (
                  <div key={r.district} className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
                    <div>
                      <div className="font-semibold text-stone-900">{r.district}</div>
                      <div className={`text-xs font-semibold ${riskColor(r.riskProfile)}`}>{r.riskProfile}</div>
                    </div>
                    <div className="text-sm font-semibold text-stone-700">PD: {r.pd?.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-stone-900">Scenario Modeler</h4>
              <p className="mt-1 text-xs text-stone-500">Simulate impact of macro factors on portfolio risk.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-stone-600 mb-1">
                    <span>Projected Rainfall</span><span>70%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={70} className="w-full accent-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-stone-600 mb-1">
                    <span>Commodity Price Volatility</span><span>30%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={30} className="w-full accent-emerald-500" />
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                  <div className="text-sm font-semibold text-rose-700">CRITICAL WARNING</div>
                  <div className="mt-2 text-xs text-rose-700">Under current rainfall projection, PD for high-risk districts is projected to rise by Q3.</div>
                </div>
                <button className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Run Simulation Model</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
