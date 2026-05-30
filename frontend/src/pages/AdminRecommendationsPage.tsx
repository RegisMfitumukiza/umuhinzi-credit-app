import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecommendationType =
  | "LOAN_AMOUNT"
  | "FINANCIAL_IMPROVEMENT"
  | "REPAYMENT_STRATEGY"
  | "PRODUCTIVITY"
  | "RISK_REDUCTION"
  | "DATA_COMPLETENESS"
  | "GENERAL_ADVISORY";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RecStatus = "PENDING" | "READ" | "DISMISSED" | "COMPLETED";

interface FarmerOption {
  id: string;
  user: { id: string; fullName: string; email: string };
}

interface Recommendation {
  id: string;
  farmerId: string;
  type: RecommendationType;
  priority: Priority;
  status: RecStatus;
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  farmer: { id: string; user: { fullName: string; email: string } } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REC_TYPES: RecommendationType[] = [
  "LOAN_AMOUNT",
  "FINANCIAL_IMPROVEMENT",
  "REPAYMENT_STRATEGY",
  "PRODUCTIVITY",
  "RISK_REDUCTION",
  "DATA_COMPLETENESS",
  "GENERAL_ADVISORY",
];

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const toWords = (s: string) =>
  s.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

const typeBadge = (t: RecommendationType): string => {
  const map: Record<RecommendationType, string> = {
    LOAN_AMOUNT: "bg-blue-100 text-blue-700",
    FINANCIAL_IMPROVEMENT: "bg-brand-100 text-brand-700",
    REPAYMENT_STRATEGY: "bg-teal-100 text-teal-700",
    PRODUCTIVITY: "bg-lime-100 text-lime-700",
    RISK_REDUCTION: "bg-orange-100 text-orange-700",
    DATA_COMPLETENESS: "bg-purple-100 text-purple-700",
    GENERAL_ADVISORY: "bg-stone-100 text-stone-600",
  };
  return map[t] ?? "bg-stone-100 text-stone-600";
};

const priorityBadge = (p: Priority): string => {
  const map: Record<Priority, string> = {
    LOW: "bg-stone-100 text-stone-500",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };
  return map[p] ?? "bg-stone-100 text-stone-600";
};

const statusBadge = (s: RecStatus): string => {
  const map: Record<RecStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    READ: "bg-blue-100 text-blue-700",
    DISMISSED: "bg-stone-100 text-stone-500",
    COMPLETED: "bg-brand-100 text-brand-700",
  };
  return map[s] ?? "bg-stone-100 text-stone-600";
};

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (rec: Recommendation) => void;
}

const CreateRecommendationModal = ({ onClose, onCreated }: CreateModalProps) => {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [farmerSearch, setFarmerSearch] = useState("");

  const [farmerId, setFarmerId] = useState("");
  const [type, setType] = useState<RecommendationType>("GENERAL_ADVISORY");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/farmers?limit=200")
      .then((r) => setFarmers(r.data.data ?? []))
      .catch(() => setFarmers([]))
      .finally(() => setFarmersLoading(false));
  }, []);

  const filteredFarmers = farmerSearch.trim()
    ? farmers.filter(
        (f) =>
          f.user.fullName.toLowerCase().includes(farmerSearch.toLowerCase()) ||
          f.user.email.toLowerCase().includes(farmerSearch.toLowerCase())
      )
    : farmers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) { showToast("Please select a farmer.", "error"); return; }
    if (!title.trim()) { showToast("Title is required.", "error"); return; }
    if (!message.trim()) { showToast("Message is required.", "error"); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        farmerId,
        type,
        priority,
        title: title.trim(),
        message: message.trim(),
      };
      if (actionLabel.trim()) body.actionLabel = actionLabel.trim();
      if (actionUrl.trim()) body.actionUrl = actionUrl.trim();

      const r = await api.post("/recommendations", body);
      onCreated(r.data.data as Recommendation);
      showToast("Recommendation created.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Failed to create recommendation."
          : "Failed to create recommendation.";
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
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-base font-black text-stone-900">Create recommendation</h2>
          <p className="text-xs text-stone-400 mt-0.5">Send an advisory directly to a farmer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Farmer search + select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Farmer <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            {farmersLoading ? (
              <p className="text-xs text-stone-400 px-1">Loading farmers…</p>
            ) : (
              <select
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                size={filteredFarmers.length > 0 ? Math.min(5, filteredFarmers.length) : 1}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">— Select farmer —</option>
                {filteredFarmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.user.fullName} ({f.user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RecommendationType)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                {REC_TYPES.map((t) => (
                  <option key={t} value={t}>{toWords(t)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{toWords(p)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Consider diversifying your crops"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a detailed advisory message for this farmer…"
              rows={4}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
            />
          </div>

          {/* Action (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Action label <span className="text-stone-300">(optional)</span>
              </label>
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="e.g. View loans"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Action URL <span className="text-stone-300">(optional)</span>
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/loans"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {saving ? "Creating…" : "Create recommendation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminRecommendationsPage = () => {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState<RecommendationType | "ALL">("ALL");

  useEffect(() => {
    api
      .get("/recommendations?limit=200")
      .then((r) => setRecs((r.data.data as Recommendation[]) ?? []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (rec: Recommendation) => {
    setRecs((prev) => [rec, ...prev]);
  };

  const filtered =
    typeFilter === "ALL" ? recs : recs.filter((r) => r.type === typeFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Recommendations</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Send advisory recommendations to farmers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors"
        >
          + Create
        </button>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            typeFilter === "ALL"
              ? "bg-stone-900 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          All ({recs.length})
        </button>
        {REC_TYPES.map((t) => {
          const count = recs.filter((r) => r.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {toWords(t)}
              {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-stone-400 text-sm font-medium">No recommendations yet.</p>
            {typeFilter === "ALL" && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-full transition-colors"
              >
                Create first recommendation
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Farmer", "Type", "Priority", "Title", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-stone-400 px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {rec.farmer ? (
                      <div>
                        <p className="font-medium text-stone-900 text-xs">
                          {rec.farmer.user.fullName}
                        </p>
                        <p className="text-stone-400 text-xs">{rec.farmer.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeBadge(rec.type)}`}
                    >
                      {toWords(rec.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${priorityBadge(rec.priority)}`}
                    >
                      {toWords(rec.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700 text-xs max-w-xs truncate font-medium">
                    {rec.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(rec.status)}`}
                    >
                      {toWords(rec.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                    {formatDate(rec.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateRecommendationModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};
