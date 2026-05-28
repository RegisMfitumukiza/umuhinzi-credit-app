import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

type UserStats = {
  totalUsers: number;
  byRole: { farmers: number; cooperativeManagers: number; institutions: number; admins: number; governmentPartners: number };
  byStatus: { active: number; pending: number; suspended: number; deactivated: number };
};
type AuditLog = { id: string; action: string; resource: string; description: string; createdAt: string };

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, logsRes] = await Promise.allSettled([
          api.get("/v1/users/stats"),
          api.get("/v1/audit-logs?limit=5"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
        if (logsRes.status === "fulfilled") setLogs(logsRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "Total Farmers", value: stats?.byRole.farmers ?? "—" },
    { label: "Cooperative Managers", value: stats?.byRole.cooperativeManagers ?? "—" },
    { label: "Finance Institutions", value: stats?.byRole.institutions ?? "—" },
    { label: "Government Accounts", value: stats?.byRole.governmentPartners ?? "—" },
  ];

  const statusCards = [
    { label: "Active Users", value: stats?.byStatus.active ?? "—", color: "text-emerald-600" },
    { label: "Pending Verification", value: stats?.byStatus.pending ?? "—", color: "text-amber-600" },
    { label: "Suspended", value: stats?.byStatus.suspended ?? "—", color: "text-rose-600" },
    { label: "Total Users", value: stats?.totalUsers ?? "—", color: "text-stone-900" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Admin Overview</h1>
            <p className="mt-1 text-sm text-stone-500">Welcome back, {user?.fullName ?? "Admin"}</p>
          </div>
          <button onClick={() => navigate("/admin/users")} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white">Manage Users</button>
        </div>

        {/* Role stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Status stats */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{s.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${s.color}`}>{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* User distribution chart */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">User Distribution by Role</h3>
            </div>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : stats && (
              <div className="h-48">
                <svg viewBox="0 0 500 160" className="w-full h-full" aria-hidden>
                  {[
                    { label: "Farmers", value: stats.byRole.farmers, color: "#10b981" },
                    { label: "Coop Mgrs", value: stats.byRole.cooperativeManagers, color: "#3b82f6" },
                    { label: "Institutions", value: stats.byRole.institutions, color: "#f59e0b" },
                    { label: "Gov", value: stats.byRole.governmentPartners, color: "#8b5cf6" },
                  ].map((item, i) => {
                    const maxVal = Math.max(stats.byRole.farmers, 1);
                    const barH = Math.max((item.value / maxVal) * 100, 4);
                    return (
                      <g key={item.label} transform={`translate(${40 + i * 110}, 0)`}>
                        <rect x={0} y={120 - barH} width={60} height={barH} fill={item.color} rx={6} />
                        <text x={30} y={138} textAnchor="middle" fontSize="11" fill="#78716c">{item.label}</text>
                        <text x={30} y={112 - barH} textAnchor="middle" fontSize="12" fill="#1c1917" fontWeight="600">{item.value}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Recent audit logs */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-stone-900">Recent Activity</div>
                <button onClick={() => navigate("/admin/users")} className="text-xs text-emerald-600 hover:underline">View all →</button>
              </div>
              {loading ? <p className="text-sm text-stone-400">Loading...</p> : logs.length === 0 ? (
                <p className="text-sm text-stone-400">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="text-sm">
                      <span className="font-medium text-stone-700">{log.action}</span>
                      <span className="text-stone-500"> — {log.description}</span>
                      <div className="text-xs text-stone-400">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
