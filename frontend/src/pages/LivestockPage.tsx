import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface LivestockRecord {
  id: string;
  type: string;
  purpose: string | null;
  quantity: number | null;
  estimatedValue: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface LivestockForm {
  type: string;
  purpose: string;
  quantity: string;
  estimatedValue: string;
  notes: string;
}

const LIVESTOCK_TYPES = [
  "CATTLE", "GOAT", "SHEEP", "PIG", "CHICKEN",
  "DUCK", "RABBIT", "FISH", "BEE", "OTHER",
] as const;

const PURPOSES = [
  "MILK", "MEAT", "EGGS", "BREEDING", "FARM_WORK", "COMMERCIAL", "OTHER",
] as const;

const TYPE_BADGE: Record<string, string> = {
  CATTLE:  "bg-amber-100 text-amber-700",
  GOAT:    "bg-green-100 text-green-700",
  SHEEP:   "bg-stone-100 text-stone-600",
  PIG:     "bg-pink-100 text-pink-700",
  CHICKEN: "bg-yellow-100 text-yellow-700",
  DUCK:    "bg-blue-100 text-blue-700",
  RABBIT:  "bg-purple-100 text-purple-700",
  FISH:    "bg-sky-100 text-sky-700",
  BEE:     "bg-orange-100 text-orange-700",
  OTHER:   "bg-stone-100 text-stone-500",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   "bg-brand-100 text-brand-700",
  SOLD:     "bg-stone-100 text-stone-500",
  DECEASED: "bg-red-100 text-red-600",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const EMPTY_FORM: LivestockForm = {
  type: "CATTLE",
  purpose: "",
  quantity: "",
  estimatedValue: "",
  notes: "",
};

const fieldClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

export const LivestockPage = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<LivestockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LivestockForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/livestock?limit=100")
      .then((r) => {
        const d = r.data.data;
        setRecords(Array.isArray(d) ? d : (d?.livestock ?? []));
      })
      .catch(() => showToast("Failed to load livestock.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = { type: form.type };
      if (form.purpose) body.purpose = form.purpose;
      if (form.quantity) body.quantity = parseInt(form.quantity, 10);
      if (form.estimatedValue) body.estimatedValue = Number(form.estimatedValue);
      if (form.notes.trim()) body.notes = form.notes.trim();

      const { data } = await api.post("/livestock", body);
      setRecords((prev) => [data.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      showToast("Livestock added!", "success");
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to add livestock.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/livestock/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
      showToast("Livestock removed.", "success");
    } catch {
      showToast("Failed to delete livestock.", "error");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Livestock</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Livestock value is one of the 9 credit score factors.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setForm(EMPTY_FORM); }}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors shrink-0"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="font-bold text-stone-900 md:col-span-2 text-sm">New livestock record</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className={fieldClass}
            >
              {LIVESTOCK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Purpose <span className="text-stone-400">(optional)</span>
            </label>
            <select
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              className={fieldClass}
            >
              <option value="">— select —</option>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase().replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Quantity <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="e.g. 10"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Estimated value (RWF) <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.estimatedValue}
              onChange={(e) => setForm((p) => ({ ...p, estimatedValue: e.target.value }))}
              placeholder="e.g. 500000"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Notes <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional details…"
              maxLength={500}
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* Records list */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {records.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-sm">
            No livestock recorded yet. Add your first entry to improve your credit score.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {records.map((rec) => (
              <div key={rec.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${TYPE_BADGE[rec.type] ?? "bg-stone-100 text-stone-500"}`}
                    >
                      {rec.type.charAt(0) + rec.type.slice(1).toLowerCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[rec.status] ?? "bg-stone-100 text-stone-500"}`}
                    >
                      {rec.status.charAt(0) + rec.status.slice(1).toLowerCase()}
                    </span>
                    {rec.purpose && (
                      <span className="text-xs text-stone-500">
                        {rec.purpose.charAt(0) + rec.purpose.slice(1).toLowerCase().replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {rec.quantity != null && (
                      <p className="text-sm font-semibold text-stone-800">
                        {rec.quantity.toLocaleString()} head
                      </p>
                    )}
                    {rec.estimatedValue != null && (
                      <p className="text-xs text-stone-500">
                        ~{rec.estimatedValue.toLocaleString()} RWF
                      </p>
                    )}
                    <p className="text-xs text-stone-400">{formatDate(rec.createdAt)}</p>
                  </div>
                  {rec.notes && (
                    <p className="text-xs text-stone-500 mt-1 italic">{rec.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {confirmDelete === rec.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-full"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        disabled={deleting === rec.id}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                      >
                        {deleting === rec.id ? "…" : "Confirm"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(rec.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
