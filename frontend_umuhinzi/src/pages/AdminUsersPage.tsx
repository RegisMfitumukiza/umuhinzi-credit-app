import { useEffect, useState } from "react";
import { api } from "../api/http";

type User = { id: string; fullName: string; email: string; phone?: string; role: string; status: string; createdAt: string };

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-rose-50 text-rose-700",
  DEACTIVATED: "bg-stone-100 text-stone-500",
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/v1/users?${params.toString()}`);
      setUsers(res.data.data ?? []);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = () => { setPage(1); load(1); };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(user.id + "status");
    try {
      const res = await api.patch(`/v1/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: res.data.data.status } : u));
    } catch {}
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setActionLoading(id + "delete");
    try {
      await api.delete(`/v1/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {}
    finally { setActionLoading(null); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">User Management</h1>
            <p className="mt-1 text-sm text-stone-500">Search, filter, and manage all platform users.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name, email, phone..."
            className="flex-1 min-w-[200px] rounded-xl border border-stone-200 px-4 py-2 text-sm outline-none focus:border-emerald-400"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
            <option value="">All Roles</option>
            <option value="FARMER">Farmer</option>
            <option value="COOPERATIVE_MANAGER">Cooperative Manager</option>
            <option value="INSTITUTION">Institution</option>
            <option value="GOVERNMENT_PARTNER">Government Partner</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
          <button onClick={handleSearch} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white">Search</button>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-stone-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-400">No users found.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-stone-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900">{u.fullName}</td>
                    <td className="px-4 py-3 text-stone-600">{u.email}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor[u.status] ?? "bg-stone-100 text-stone-600"}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusToggle(u)}
                          disabled={actionLoading === u.id + "status"}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${u.status === "ACTIVE" ? "border border-rose-200 text-rose-600 hover:bg-rose-50" : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={actionLoading === u.id + "delete"}
                          className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:opacity-40">‹</button>
            <span className="text-sm text-stone-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:opacity-40">›</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
