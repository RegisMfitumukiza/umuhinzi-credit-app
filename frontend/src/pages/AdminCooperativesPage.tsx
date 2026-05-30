import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  status: string;
  createdAt: string;
  _count?: { members: number };
}

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-brand-100 text-brand-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
    DEACTIVATED: "bg-stone-100 text-stone-500",
  };
  return map[s] ?? "bg-stone-100 text-stone-600";
};

// ─── Manage Cooperative Modal ─────────────────────────────────────────────────

interface ManageModalProps {
  cooperative: Cooperative;
  onClose: () => void;
  onUpdated: (updated: Cooperative) => void;
  onDeleted: (id: string) => void;
}

const ManageCooperativeModal = ({
  cooperative,
  onClose,
  onUpdated,
  onDeleted,
}: ManageModalProps) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState(cooperative.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (status === cooperative.status) { onClose(); return; }
    setSaving(true);
    try {
      const r = await api.patch(`/cooperatives/${cooperative.id}/status`, { status });
      onUpdated({ ...cooperative, status: r.data.data?.status ?? status });
      showToast("Cooperative updated successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to update."
          : "Failed to update.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/cooperatives/${cooperative.id}`);
      onDeleted(cooperative.id);
      showToast("Cooperative deactivated.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to deactivate."
          : "Failed to deactivate.";
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
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-black text-stone-900">{cooperative.name}</h2>
          {cooperative.registrationNumber && (
            <p className="text-xs text-stone-400 mt-0.5">{cooperative.registrationNumber}</p>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 text-sm">
          {cooperative.email && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Email</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative.email}</p>
            </div>
          )}
          {cooperative.phone && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Phone</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative.phone}</p>
            </div>
          )}
          {cooperative._count && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Members</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative._count.members}</p>
            </div>
          )}
          {cooperative.district && (
            <div>
              <p className="text-xs text-stone-400 font-medium">District</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative.district}</p>
            </div>
          )}
          {cooperative.sector && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Sector</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative.sector}</p>
            </div>
          )}
          {cooperative.description && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Description</p>
              <p className="text-stone-700 font-medium mt-0.5">{cooperative.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-400 font-medium">Created</p>
            <p className="text-stone-700 font-medium mt-0.5">{formatDate(cooperative.createdAt)}</p>
          </div>
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
              <option key={s} value={s}>{s}</option>
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
              Deactivate cooperative
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 text-center font-medium">
                This will deactivate <strong>{cooperative.name}</strong>.
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
                  {deleting ? "Deactivating…" : "Yes, deactivate"}
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

export const AdminCooperativesPage = () => {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managing, setManaging] = useState<Cooperative | null>(null);

  useEffect(() => {
    api
      .get("/cooperatives?limit=100")
      .then((r) => setCooperatives(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cooperatives.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.district ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdated = (updated: Cooperative) => {
    setCooperatives((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleted = (id: string) => {
    setCooperatives((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "DEACTIVATED" } : c))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Cooperatives</h1>
        <p className="text-stone-500 text-sm mt-0.5">Manage agricultural cooperatives and their status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name or district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No cooperatives found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Name", "Reg. number", "District", "Members", "Status", "Created", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-stone-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{c.name}</p>
                    {c.email && <p className="text-xs text-stone-400">{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">
                    {c.registrationNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{c.district ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600 font-semibold">
                    {c._count?.members ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManaging(c)}
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
        <ManageCooperativeModal
          cooperative={managing}
          onClose={() => setManaging(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};
