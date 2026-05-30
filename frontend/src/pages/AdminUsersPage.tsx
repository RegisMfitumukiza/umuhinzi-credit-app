import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLES = [
  "FARMER",
  "INSTITUTION",
  "COOPERATIVE_MANAGER",
  "ADMIN",
  "GOVERNMENT_PARTNER",
] as const;

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    FARMER: "bg-brand-100 text-brand-700",
    ADMIN: "bg-stone-800 text-white",
    INSTITUTION: "bg-blue-100 text-blue-700",
    COOPERATIVE_MANAGER: "bg-purple-100 text-purple-700",
    GOVERNMENT_PARTNER: "bg-orange-100 text-orange-700",
  };
  return map[role] ?? "bg-stone-100 text-stone-600";
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-brand-100 text-brand-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
    DEACTIVATED: "bg-stone-100 text-stone-500",
  };
  return map[status] ?? "bg-stone-100 text-stone-600";
};

// ─── Manage User Modal ────────────────────────────────────────────────────────

interface ManageModalProps {
  user: User;
  onClose: () => void;
  onUpdated: (updated: User) => void;
  onDeleted: (id: string) => void;
}

const ManageUserModal = ({
  user,
  onClose,
  onUpdated,
  onDeleted,
}: ManageModalProps) => {
  const { showToast } = useToast();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    const roleChanged = role !== user.role;
    const statusChanged = status !== user.status;
    if (!roleChanged && !statusChanged) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      let updated = { ...user };
      if (roleChanged) {
        const r = await api.patch(`/users/${user.id}/role`, { role });
        updated = { ...updated, role: r.data.data.user?.role ?? role };
      }
      if (statusChanged) {
        const r = await api.patch(`/users/${user.id}/status`, { status });
        updated = { ...updated, status: r.data.data.user?.status ?? status };
      }
      onUpdated(updated);
      showToast("User updated successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to update user."
          : "Failed to update user.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${user.id}`);
      onDeleted(user.id);
      showToast("User deleted.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to delete user."
          : "Failed to delete user.";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-black text-stone-900">{user.fullName}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* Delete section */}
        <div className="border-t border-stone-100 pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
            >
              Delete user
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 text-center font-medium">
                This will permanently delete{" "}
                <strong>{user.fullName}</strong>. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [managing, setManaging] = useState<User | null>(null);

  useEffect(() => {
    api
      .get("/users")
      .then((r) => setUsers(r.data.data.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdated = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleDeleted = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Users</h1>
          <p className="text-stone-500 text-sm mt-0.5">{users.length} registered</p>
        </div>
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 w-56 transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Name", "Email", "Role", "Status", "Joined", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left text-xs font-semibold text-stone-400 px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-stone-900">{u.fullName}</td>
                  <td className="px-5 py-3 text-stone-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadge(u.role)}`}
                    >
                      {u.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(u.status)}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-400">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setManaging(u)}
                      className="text-xs font-semibold text-stone-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-full border border-stone-200 hover:border-brand-200 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {managing && (
        <ManageUserModal
          user={managing}
          onClose={() => setManaging(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};
