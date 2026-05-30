import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface FarmerUser {
  id: string;
  fullName: string;
  email: string;
  province: string | null;
  district: string | null;
}

interface Farmer {
  id: string;
  nationalId: string;
  dateOfBirth: string | null;
  gender: string | null;
  farmingExperienceYears: number | null;
  primaryCrop: string | null;
  status: string;
  credibilityStatus: string;
  createdAt: string;
  user: FarmerUser;
}

const STATUSES = ["PENDING", "VERIFIED", "SUSPENDED"] as const;
const CREDIBILITIES = ["LOW", "MEDIUM", "HIGH", "TRUSTED"] as const;

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    VERIFIED: "bg-brand-100 text-brand-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };
  return map[s] ?? "bg-stone-100 text-stone-600";
};

const credibilityBadge = (c: string) => {
  const map: Record<string, string> = {
    TRUSTED: "bg-brand-100 text-brand-700",
    HIGH: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-red-100 text-red-700",
  };
  return map[c] ?? "bg-stone-100 text-stone-600";
};

// ─── Manage Farmer Modal ──────────────────────────────────────────────────────

interface ManageModalProps {
  farmer: Farmer;
  onClose: () => void;
  onUpdated: (updated: Farmer) => void;
}

const ManageFarmerModal = ({ farmer, onClose, onUpdated }: ManageModalProps) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState(farmer.status);
  const [credibility, setCredibility] = useState(farmer.credibilityStatus);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    const statusChanged = status !== farmer.status;
    const credibilityChanged = credibility !== farmer.credibilityStatus;
    if (!statusChanged && !credibilityChanged) { onClose(); return; }

    setSaving(true);
    try {
      let updated = { ...farmer };
      if (statusChanged) {
        const r = await api.patch(`/farmers/${farmer.id}/status`, { status });
        updated = { ...updated, status: r.data.data?.status ?? status };
      }
      if (credibilityChanged) {
        const r = await api.patch(`/farmers/${farmer.id}/credibility`, { credibilityStatus: credibility });
        updated = { ...updated, credibilityStatus: r.data.data?.credibilityStatus ?? credibility };
      }
      onUpdated(updated);
      showToast("Farmer updated successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to update farmer."
          : "Failed to update farmer.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
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
          <h2 className="text-base font-black text-stone-900">{farmer.user.fullName}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{farmer.user.email}</p>
        </div>

        {/* Profile details */}
        <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 font-medium">National ID</p>
            <p className="text-stone-700 font-medium mt-0.5">{farmer.nationalId}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Primary crop</p>
            <p className="text-stone-700 font-medium mt-0.5">{farmer.primaryCrop ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Experience</p>
            <p className="text-stone-700 font-medium mt-0.5">
              {farmer.farmingExperienceYears != null ? `${farmer.farmingExperienceYears} yrs` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Gender</p>
            <p className="text-stone-700 font-medium mt-0.5">{farmer.gender ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Province</p>
            <p className="text-stone-700 font-medium mt-0.5">{farmer.user.province ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">District</p>
            <p className="text-stone-700 font-medium mt-0.5">{farmer.user.district ?? "—"}</p>
          </div>
          {farmer.dateOfBirth && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Date of birth</p>
              <p className="text-stone-700 font-medium mt-0.5">{formatDate(farmer.dateOfBirth)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-400 font-medium">Joined</p>
            <p className="text-stone-700 font-medium mt-0.5">{formatDate(farmer.createdAt)}</p>
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

        {/* Credibility */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Credibility
          </label>
          <select
            value={credibility}
            onChange={(e) => setCredibility(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          >
            {CREDIBILITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
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
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminFarmersPage = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [credibilityFilter, setCredibilityFilter] = useState("");
  const [managing, setManaging] = useState<Farmer | null>(null);

  const fetchFarmers = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (credibilityFilter) params.set("credibility", credibilityFilter);
    if (search) params.set("search", search);
    params.set("limit", "100");

    setLoading(true);
    Promise.allSettled([
      api.get(`/farmers?${params.toString()}`),
      api.get("/farmers/stats"),
    ]).then(([farmersRes, statsRes]) => {
      if (farmersRes.status === "fulfilled")
        setFarmers(farmersRes.value.data.data ?? []);
      if (statsRes.status === "fulfilled")
        setStats(statsRes.value.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchFarmers(); }, [statusFilter, credibilityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFarmers();
  };

  const handleUpdated = (updated: Farmer) => {
    setFarmers((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const byStatus = stats && typeof stats === "object" && "byStatus" in stats
    ? (stats.byStatus as Record<string, number>)
    : {};
  const byCredibility = stats && typeof stats === "object" && "byCredibility" in stats
    ? (stats.byCredibility as Record<string, number>)
    : {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Farmers</h1>
        <p className="text-stone-500 text-sm mt-0.5">Manage farmer profiles, status, and credibility</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(byStatus).map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-xs text-stone-500 font-medium">{k}</p>
              <p className="text-2xl font-black text-stone-900 mt-1">{v}</p>
            </div>
          ))}
          {Object.entries(byCredibility).map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-xs text-stone-500 font-medium">{k}</p>
              <p className="text-2xl font-black text-stone-900 mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition-colors"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={credibilityFilter}
          onChange={(e) => setCredibilityFilter(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All credibilities</option>
          {CREDIBILITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : farmers.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No farmers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Name", "National ID", "Crop", "District", "Status", "Credibility", "Joined", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-stone-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{f.user.fullName}</p>
                    <p className="text-xs text-stone-400">{f.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">{f.nationalId}</td>
                  <td className="px-4 py-3 text-stone-600">{f.primaryCrop ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{f.user.district ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${credibilityBadge(f.credibilityStatus)}`}>
                      {f.credibilityStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{formatDate(f.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManaging(f)}
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
        <ManageFarmerModal
          farmer={managing}
          onClose={() => setManaging(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};
