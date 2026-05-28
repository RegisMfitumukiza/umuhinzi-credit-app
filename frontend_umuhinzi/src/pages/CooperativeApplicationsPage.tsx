import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

type Application = {
  id: string; amount: number; purpose: string; status: string; createdAt: string;
  repaymentPeriodMonths: number;
  farmer?: { fullName: string; email: string; district?: string };
  creditScore?: { score: number; tier: string };
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-stone-100 text-stone-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DISBURSED: "bg-purple-100 text-purple-700",
};

export const CooperativeApplicationsPage = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/v1/loan-applications?${params.toString()}`);
      setApps(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED" | "DISBURSED", notes = "") => {
    setActionLoading(id + action);
    try {
      await api.patch(`/v1/loan-applications/${id}/status`, { status: action, reviewNotes: notes });
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: action } : a));
    } catch {}
    finally { setActionLoading(null); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/v1/exports/loan-applications", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "loan-applications.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const pending = apps.filter((a) => a.status === "PENDING").length;
  const approved = apps.filter((a) => a.status === "APPROVED").length;
  const avgScore = apps.length ? Math.round(apps.reduce((s, a) => s + (a.creditScore?.score ?? 0), 0) / apps.length) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Loan Applications</h1>
            <p className="mt-1 text-sm text-stone-500">Review and manage agricultural loan requests.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Export CSV</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Requests", value: apps.length },
            { label: "Pending Review", value: pending },
            { label: "Approved (Total)", value: approved },
            { label: "Avg. Credit Score", value: avgScore || "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
              placeholder="Search by farmer name..."
            />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DISBURSED">Disbursed</option>
            </select>
            <button onClick={load} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white">Search</button>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            {loading ? <p className="py-6 text-sm text-stone-400">Loading...</p> : apps.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-400">No applications found.</p>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.15em] text-stone-400">
                    <th className="px-3 py-2">Farmer</th>
                    <th className="px-3 py-2">Purpose</th>
                    <th className="px-3 py-2">Amount (RWF)</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">
                            {app.farmer?.fullName?.[0] ?? "?"}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900">{app.farmer?.fullName ?? "—"}</div>
                            <div className="text-xs text-stone-500">{app.farmer?.district ?? app.farmer?.email ?? ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-stone-600">{app.purpose}</td>
                      <td className="px-3 py-4 font-semibold text-stone-900">{app.amount?.toLocaleString()}</td>
                      <td className="px-3 py-4">
                        {app.creditScore
                          ? <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">{app.creditScore.tier}</div>
                          : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="px-3 py-4 text-stone-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[app.status] ?? "bg-stone-100 text-stone-600"}`}>{app.status}</span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/cooperatives/applications/${app.id}`)} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50">Review</button>
                          {app.status === "PENDING" || app.status === "UNDER_REVIEW" ? (
                            <>
                              <button
                                onClick={() => handleAction(app.id, "APPROVED")}
                                disabled={actionLoading === app.id + "APPROVED"}
                                className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(app.id, "REJECTED")}
                                disabled={actionLoading === app.id + "REJECTED"}
                                className="rounded-full border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                                Reject
                              </button>
                            </>
                          ) : app.status === "APPROVED" ? (
                            <button
                              onClick={() => handleAction(app.id, "DISBURSED")}
                              disabled={actionLoading === app.id + "DISBURSED"}
                              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50">
                              Disburse
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
