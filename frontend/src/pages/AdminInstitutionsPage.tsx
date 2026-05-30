import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface Institution {
  id: string;
  name: string;
  type: string;
  registrationNumber: string | null;
  licenseNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  status: string;
  createdAt: string;
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

const typeBadge = (t: string) => {
  const map: Record<string, string> = {
    BANK: "bg-blue-100 text-blue-700",
    SACCO: "bg-purple-100 text-purple-700",
    MICROFINANCE: "bg-orange-100 text-orange-700",
    NGO: "bg-teal-100 text-teal-700",
    GOVERNMENT_PROGRAM: "bg-stone-200 text-stone-700",
    OTHER: "bg-stone-100 text-stone-500",
  };
  return map[t] ?? "bg-stone-100 text-stone-600";
};

// ─── Manage Institution Modal ─────────────────────────────────────────────────

interface ManageModalProps {
  institution: Institution;
  onClose: () => void;
  onUpdated: (updated: Institution) => void;
  onDeleted: (id: string) => void;
}

const ManageInstitutionModal = ({
  institution,
  onClose,
  onUpdated,
  onDeleted,
}: ManageModalProps) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState(institution.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (status === institution.status) { onClose(); return; }
    setSaving(true);
    try {
      const r = await api.patch(`/institutions/${institution.id}/status`, { status });
      onUpdated({ ...institution, status: r.data.data?.status ?? status });
      showToast("Institution updated successfully.", "success");
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
      await api.delete(`/institutions/${institution.id}`);
      onDeleted(institution.id);
      showToast("Institution deactivated.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to delete."
          : "Failed to delete.";
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-stone-900">{institution.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${typeBadge(institution.type)}`}>
                {institution.type.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 text-sm">
          {institution.email && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Email</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.email}</p>
            </div>
          )}
          {institution.phone && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Phone</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.phone}</p>
            </div>
          )}
          {institution.registrationNumber && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Reg. number</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.registrationNumber}</p>
            </div>
          )}
          {institution.licenseNumber && (
            <div>
              <p className="text-xs text-stone-400 font-medium">License</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.licenseNumber}</p>
            </div>
          )}
          {institution.district && (
            <div>
              <p className="text-xs text-stone-400 font-medium">District</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.district}</p>
            </div>
          )}
          {institution.address && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Address</p>
              <p className="text-stone-700 font-medium mt-0.5">{institution.address}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-400 font-medium">Registered</p>
            <p className="text-stone-700 font-medium mt-0.5">{formatDate(institution.createdAt)}</p>
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
              Deactivate institution
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 text-center font-medium">
                This will deactivate <strong>{institution.name}</strong>.
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

export const AdminInstitutionsPage = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managing, setManaging] = useState<Institution | null>(null);

  useEffect(() => {
    api
      .get("/institutions?limit=100")
      .then((r) => setInstitutions(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = institutions.filter((inst) => {
    const matchSearch =
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      (inst.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inst.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdated = (updated: Institution) => {
    setInstitutions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleted = (id: string) => {
    setInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "DEACTIVATED" } : i))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Institutions</h1>
        <p className="text-stone-500 text-sm mt-0.5">Manage financial institutions and their status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name or email…"
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
          <p className="text-stone-400 text-sm text-center py-12">No institutions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Name", "Type", "Email", "District", "Status", "Registered", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-stone-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-stone-900">{inst.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeBadge(inst.type)}`}>
                      {inst.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{inst.email ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{inst.district ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(inst.status)}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{formatDate(inst.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManaging(inst)}
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
        <ManageInstitutionModal
          institution={managing}
          onClose={() => setManaging(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};
