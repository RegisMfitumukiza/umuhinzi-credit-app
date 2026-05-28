import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

type PortfolioStats = { totalPortfolio: number; totalFarmers: number; nplRatio: number; recoveryRate: number };
type LoanApp = { id: string; amount: number; purpose: string; status: string; createdAt: string; farmer?: { fullName: string; district?: string } };

export const FinanceDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [apps, setApps] = useState<LoanApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, appsRes] = await Promise.allSettled([
          api.get("/v1/analytics/portfolio-stats"),
          api.get("/v1/loan-applications?limit=5&status=PENDING"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
        if (appsRes.status === "fulfilled") setApps(appsRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(id + status);
    try {
      await api.patch(`/v1/loan-applications/${id}/status`, { status });
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch {}
    finally { setActionLoading(null); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/v1/exports/loan-applications", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "applications.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const metricCards = [
    { label: "Active Portfolio", value: stats ? `RWF ${(stats.totalPortfolio / 1_000_000).toFixed(1)}M` : "—" },
    { label: "Active Farmers", value: stats?.totalFarmers?.toLocaleString() ?? "—" },
    { label: "NPL Ratio", value: stats ? `${stats.nplRatio?.toFixed(1)}%` : "—" },
    { label: "Loan Recovery", value: stats ? `${stats.recoveryRate?.toFixed(1)}%` : "—" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Financial Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">Welcome back, {user?.fullName ?? "—"}. Loan portfolio overview.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Export CSV</button>
            <button onClick={() => navigate("/finance/applications")} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">View All Applications</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((m) => (
            <div key={m.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{m.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : m.value}</div>
            </div>
          ))}
        </div>

        {/* Recent applications */}
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Pending Applications</h3>
            <button onClick={() => navigate("/finance/applications")} className="text-sm text-emerald-600 hover:underline">View all →</button>
          </div>
          {loading ? <p className="text-sm text-stone-400">Loading...</p> : apps.length === 0 ? (
            <p className="text-sm text-stone-400">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-100 p-4">
                  <div>
                    <div className="font-semibold text-stone-900">{a.farmer?.fullName ?? "—"}</div>
                    <div className="text-xs text-stone-500">RWF {a.amount?.toLocaleString()} • {a.purpose} • {a.farmer?.district ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{a.status}</span>
                    <button onClick={() => handleAction(a.id, "APPROVED")} disabled={actionLoading === a.id + "APPROVED"} className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Approve</button>
                    <button onClick={() => handleAction(a.id, "REJECTED")} disabled={actionLoading === a.id + "REJECTED"} className="rounded-full border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
