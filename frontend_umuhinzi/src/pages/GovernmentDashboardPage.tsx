import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type PlatformAnalytics, type RegionalAnalytics } from "../api/analytics";

export const GovernmentDashboardPage = () => {
  const [platform, setPlatform] = useState<PlatformAnalytics>({});
  const [regional, setRegional] = useState<RegionalAnalytics>([]);
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [p, r] = await Promise.all([
          analyticsApi.getPlatformAnalytics().catch(() => ({} as PlatformAnalytics)),
          analyticsApi.getRegionalAnalytics().catch(() => [] as RegionalAnalytics),
        ]);
        setPlatform(p);
        setRegional(r);
      } catch {
        // silent — partial data still renders
      } finally {
        setLoading(false);
      }
    })();
  }, []); // ← removed showToast from deps — it was causing infinite re-render

  const provinces = useMemo(() => {
    const set = new Set(regional.map((r) => r.province).filter(Boolean));
    return Array.from(set) as string[];
  }, [regional]);

  const filteredRegional = useMemo(() =>
    province ? regional.filter((r) => r.province === province) : regional,
    [regional, province]
  );

  const maxFarmers = Math.max(...filteredRegional.map((r) => r.farmerCount ?? 0), 1);

  const handleExportCSV = () => {
    const header = ["Province", "District", "Farmers", "Loans", "Avg Credit Score"];
    const rows = regional.map((r) => [r.province ?? "", r.district ?? "", r.farmerCount ?? 0, r.loanCount ?? 0, r.averageCreditScore ?? 0]);
    const csv = [header, ...rows].map((row) => row.map(String).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "government_analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading government analytics...</div>;

  const cards = [
    { label: "Farmers Registered", value: platform.farmers?.total ?? 0 },
    { label: "Total Cooperatives", value: platform.cooperatives?.total ?? 0 },
    { label: "Total Institutions", value: platform.institutions?.total ?? 0 },
    { label: "Total Loans Issued", value: platform.loans?.total ?? 0 },
    { label: "Active Cooperatives", value: platform.cooperatives?.active ?? 0 },
    { label: "Active Institutions", value: platform.institutions?.active ?? 0 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Government Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">National rural finance, productivity, and inclusion insights.</p>
          </div>
          <div className="flex gap-3">
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 outline-none">
              <option value="">All Provinces</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={handleExportCSV} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Export CSV</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold text-stone-900">{card.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Regional Performance</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Live data</span>
            </div>
            {filteredRegional.length === 0 ? (
              <p className="text-sm text-stone-500">No regional data available.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {filteredRegional.map((region, i) => (
                  <div key={i} className="rounded-2xl border border-stone-100 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-stone-900">
                        {region.district ? `${region.province} — ${region.district}` : region.province || "Unknown"}
                      </span>
                      <span className="text-stone-500">Loans: {region.loanCount ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${((region.farmerCount ?? 0) / maxFarmers) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                      <span>Farmers: {region.farmerCount ?? 0}</span>
                      {region.averageCreditScore != null && (
                        <span>Avg Score: {Math.round(region.averageCreditScore)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Loan Portfolio Value</div>
              <div className="mt-2 text-3xl font-semibold text-emerald-600">
                RWF {(platform.loans?.totalValue ?? 0).toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-stone-400">From active + disbursed loans</p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Loan Status Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  { label: "Active", value: platform.loans?.active ?? 0 },
                  { label: "Disbursed", value: platform.loans?.disbursed ?? 0 },
                  { label: "Completed", value: platform.loans?.completed ?? 0 },
                  { label: "Defaulted", value: platform.loans?.defaulted ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-stone-600">{item.label}</span>
                    <span className="font-semibold text-stone-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Credit Score Overview</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Total Scores Generated</span>
                  <span className="font-semibold text-stone-900">{platform.creditScores?.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Average Score</span>
                  <span className="font-semibold text-emerald-600">
                    {platform.creditScores?.averageScore != null ? Math.round(platform.creditScores.averageScore) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Farmer Verification Status</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Total Registered</span>
                  <span className="font-semibold text-stone-900">{platform.farmers?.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Verified</span>
                  <span className="font-semibold text-emerald-600">{platform.farmers?.verified ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Pending</span>
                  <span className="font-semibold text-amber-600">{platform.farmers?.pending ?? 0}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboardPage;
