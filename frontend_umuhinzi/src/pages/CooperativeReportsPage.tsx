import { useEffect, useState } from "react";
import { api } from "../api/http";

type PortfolioStats = { totalPortfolio: number; avgRepaymentRate: number; totalFarmers: number; activeCooperatives: number };
type TopCooperative = { id: string; name: string; totalLoans: number };

export const CooperativeReportsPage = () => {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [topCoops, setTopCoops] = useState<TopCooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [format, setFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, coopsRes] = await Promise.allSettled([
          api.get("/v1/analytics/portfolio-stats"),
          api.get("/v1/cooperatives?limit=4&sortBy=totalLoans"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
        if (coopsRes.status === "fulfilled") setTopCoops(coopsRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportMsg("");
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("format", format);
      const res = await api.get(`/v1/exports/portfolio-report?${params.toString()}`, { responseType: "blob" });
      const ext = format === "pdf" ? "pdf" : "csv";
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `portfolio-report.${ext}`; a.click();
      URL.revokeObjectURL(url);
      setExportMsg("Report downloaded successfully.");
    } catch {
      setExportMsg("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const topStats = [
    { label: "Total Portfolio Value", value: stats ? `RWF ${(stats.totalPortfolio / 1_000_000_000).toFixed(1)}B` : "—" },
    { label: "Avg. Repayment Rate", value: stats ? `${stats.avgRepaymentRate?.toFixed(1)}%` : "—" },
    { label: "Farmer Inclusion", value: stats ? stats.totalFarmers?.toLocaleString() : "—" },
    { label: "Active Cooperatives", value: stats ? stats.activeCooperatives?.toLocaleString() : "—" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">Strategic oversight and data-driven impact assessment.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.65fr]">
          {/* Top cooperatives */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Top Performing Cooperatives</h2>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : topCoops.length === 0 ? (
              <p className="text-sm text-stone-400">No data available.</p>
            ) : (
              <div className="space-y-3">
                {topCoops.map((coop, i) => (
                  <div key={coop.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-stone-400">#{i + 1}</span>
                      <span className="text-sm font-semibold text-stone-900">{coop.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-700">RWF {(coop.totalLoans / 1_000_000).toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export engine */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Export Engine</h3>
            <p className="mt-1 text-xs text-stone-500">Generate CSV or PDF exports for analysis</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-500">From</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-xs text-stone-500">To</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
                <button onClick={handleExport} disabled={exporting} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {exporting ? "Exporting..." : "Download Report"}
                </button>
              </div>
              {exportMsg && <p className={`text-xs ${exportMsg.includes("failed") ? "text-red-500" : "text-green-600"}`}>{exportMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativeReportsPage;
