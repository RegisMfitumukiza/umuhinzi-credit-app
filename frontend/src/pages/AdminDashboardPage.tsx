import { useEffect, useState } from "react";
import { api } from "../api/http";
import { formatDate } from "../utils/format";

interface UserStats {
  totalUsers: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  description: string;
  createdAt: string;
  actor?: { fullName: string };
}

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get("/users/stats"),
      api.get("/audit-logs?limit=8"),
    ]).then(([statsRes, logsRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
      if (logsRes.status === "fulfilled")
        setLogs(logsRes.value.data.data.auditLogs ?? []);
      setLoading(false);
    });
  }, []);

  const downloadCsv = async (endpoint: string, filename: string) => {
    setDownloading(filename);
    try {
      const res = await api.get(endpoint, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // swallow
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-stone-500 text-sm mt-0.5">Platform overview</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm md:col-span-2">
            <p className="text-xs text-stone-500 font-medium">Total users</p>
            <p className="text-3xl font-black text-stone-900 mt-1">{stats.totalUsers}</p>
          </div>
          {Object.entries(stats.byRole ?? {}).map(([role, count]) => (
            <div key={role} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-xs text-stone-500 font-medium">{role}</p>
              <p className="text-2xl font-black text-stone-900 mt-1">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status breakdown */}
      {stats && Object.keys(stats.byStatus ?? {}).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-xs text-stone-500 font-medium">{status}</p>
              <p className="text-2xl font-black text-stone-900 mt-1">{count as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent audit logs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-4">Recent Activity</h2>
        {logs.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-6">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                      {log.action}
                    </span>
                    <span className="text-xs text-stone-400">{log.resource}</span>
                  </div>
                  <p className="text-sm text-stone-700 mt-1 truncate">{log.description}</p>
                  {log.actor && (
                    <p className="text-xs text-stone-400 mt-0.5">by {log.actor.fullName}</p>
                  )}
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exports */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-4">Exports</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Farmers CSV", endpoint: "/exports/farmers", file: "farmers.csv" },
            { label: "Loans CSV", endpoint: "/exports/loans", file: "loans.csv" },
            { label: "Repayments CSV", endpoint: "/exports/repayments", file: "repayments.csv" },
            { label: "Schedules CSV", endpoint: "/exports/repayment-schedules", file: "repayment-schedules.csv" },
          ].map(({ label, endpoint, file }) => (
            <button
              key={file}
              onClick={() => downloadCsv(endpoint, file)}
              disabled={downloading !== null}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
            >
              {downloading === file ? (
                <span className="inline-block w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
