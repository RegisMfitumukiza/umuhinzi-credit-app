import { useEffect, useState } from "react";
import { auditApi, type AuditLog, type AuditLogFilters } from "../api/auditLogs";
import { useToast } from "../context/ToastContext";

const ACTION_OPTIONS = ["", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "STATUS_CHANGE", "ROLE_CHANGE", "FILE_UPLOAD", "SYSTEM"];
const RESOURCE_OPTIONS = ["", "USER", "FARMER", "INSTITUTION", "COOPERATIVE", "FARM", "CROP", "LOAN", "REPAYMENT", "CREDIT_SCORE", "NOTIFICATION", "AUTH", "SYSTEM"];

export const AdminAuditPage = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 });

  const load = async (f: AuditLogFilters) => {
    setLoading(true);
    try {
      const result = await auditApi.getLogs(f);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch {
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(filters); }, []);

  const applyFilters = () => {
    const next = { ...filters, page: 1 };
    setFilters(next);
    void load(next);
  };

  const changePage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    void load(next);
  };

  const actionColor = (action: string) => {
    if (["DELETE", "LOGOUT"].includes(action)) return "bg-rose-100 text-rose-700";
    if (["CREATE", "LOGIN"].includes(action)) return "bg-emerald-100 text-emerald-700";
    if (["STATUS_CHANGE", "ROLE_CHANGE"].includes(action)) return "bg-amber-100 text-amber-700";
    return "bg-stone-100 text-stone-600";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Audit Center</h1>
            <p className="mt-1 text-sm text-stone-500">Track all platform actions: logins, approvals, status changes, score updates.</p>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-500">
            {pagination.total} total records
          </span>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-stone-700">Filters</p>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <select value={filters.action || ""} onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value || undefined }))} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
              {ACTION_OPTIONS.map((o) => <option key={o} value={o}>{o || "All Actions"}</option>)}
            </select>
            <select value={filters.resource || ""} onChange={(e) => setFilters((p) => ({ ...p, resource: e.target.value || undefined }))} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
              {RESOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o || "All Resources"}</option>)}
            </select>
            <input type="text" placeholder="Actor ID" value={filters.actorId || ""} onChange={(e) => setFilters((p) => ({ ...p, actorId: e.target.value || undefined }))} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <input type="date" value={filters.from || ""} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value || undefined }))} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <input type="date" value={filters.to || ""} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value || undefined }))} className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <button onClick={applyFilters} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Apply Filters</button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-stone-500">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-sm text-stone-500">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left">
                    <th className="px-4 py-3 font-semibold text-stone-600">Actor</th>
                    <th className="px-4 py-3 font-semibold text-stone-600">Role</th>
                    <th className="px-4 py-3 font-semibold text-stone-600">Action</th>
                    <th className="px-4 py-3 font-semibold text-stone-600">Resource</th>
                    <th className="px-4 py-3 font-semibold text-stone-600">Description</th>
                    <th className="px-4 py-3 font-semibold text-stone-600">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{log.actor?.fullName || "System"}</div>
                        <div className="text-xs text-stone-400">{log.actor?.email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">{log.actor?.role || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${actionColor(log.action)}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-700">{log.resource}</div>
                        {log.resourceId && <div className="max-w-[120px] truncate text-xs text-stone-400">{log.resourceId}</div>}
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-stone-600">
                        <p className="truncate">{log.description || "-"}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
              <span className="text-xs text-stone-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
              <div className="flex gap-2">
                <button onClick={() => changePage(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 disabled:opacity-40">Previous</button>
                <button onClick={() => changePage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminAuditPage;
