import { useEffect, useState } from "react";
import { api } from "../api/http";

type NationalStats = { totalFarmers: number; approvedLoans: number; repaymentRate: number; activeCooperatives: number };
type RegionalData = { province: string; farmers: number; loans: number };

export const GovernmentDashboardPage = () => {
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [regions, setRegions] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, regionsRes] = await Promise.allSettled([
          api.get("/v1/analytics/national-stats"),
          api.get("/v1/analytics/regional-performance"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
        if (regionsRes.status === "fulfilled") setRegions(regionsRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/v1/exports/national-report", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "national-report.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    finally { setExporting(false); }
  };

  const cards = [
    { label: "Farmers Onboarded", value: stats?.totalFarmers?.toLocaleString() ?? "—" },
    { label: "Approved Loans", value: stats?.approvedLoans?.toLocaleString() ?? "—" },
    { label: "Repayment Success", value: stats ? `${stats.repaymentRate?.toFixed(1)}%` : "—" },
    { label: "Active Cooperatives", value: stats?.activeCooperatives?.toLocaleString() ?? "—" },
  ];

  const maxFarmers = Math.max(...regions.map((r) => r.farmers), 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Government Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">National rural finance, productivity, and inclusion insights.</p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
            {exporting ? "Exporting..." : "Export Report"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : card.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Regional performance */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Regional Performance</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Live</span>
            </div>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : regions.length === 0 ? (
              <p className="text-sm text-stone-400">No regional data available.</p>
            ) : (
              <div className="space-y-4">
                {regions.map((region) => (
                  <div key={region.province} className="rounded-2xl border border-stone-100 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-stone-900">{region.province}</span>
                      <span className="text-stone-500">Loans: {region.loans?.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min((region.farmers / maxFarmers) * 100, 100)}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-stone-500">Farmers onboarded: {region.farmers?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Financial Inclusion Index</div>
              <div className="mt-2 text-4xl font-semibold text-emerald-600">
                {loading ? "—" : stats ? `${((stats.approvedLoans / Math.max(stats.totalFarmers, 1)) * 100).toFixed(0)}%` : "—"}
              </div>
              <p className="mt-2 text-sm text-stone-500">Growth driven by cooperative integration, digital onboarding, and improved repayment behavior.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-stone-900 mb-3">Priority Actions</div>
              <div className="space-y-2 text-sm text-stone-600">
                <div>• Support districts with low repayment stability</div>
                <div>• Expand digitization in underserved regions</div>
                <div>• Monitor climate-sensitive lending exposure</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboardPage;
