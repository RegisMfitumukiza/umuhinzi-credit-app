import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface ProductivityRecord {
  id: string;
  farmerId: string;
  seasonId: string;
  totalExpectedYield: number | null;
  totalActualYield: number;
  unit: string;
  productivityRate: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  season: { id: string; name: string; year: number };
}

interface Season {
  id: string;
  name: string;
  year: number;
}

interface AddForm {
  seasonId: string;
  totalActualYield: string;
  productivityRate: string;
  totalExpectedYield: string;
  unit: string;
  notes: string;
}

interface EditForm {
  totalActualYield: string;
  productivityRate: string;
  totalExpectedYield: string;
  unit: string;
  notes: string;
}

const EMPTY_ADD: AddForm = {
  seasonId: "",
  totalActualYield: "",
  productivityRate: "",
  totalExpectedYield: "",
  unit: "kg",
  notes: "",
};

const EMPTY_EDIT: EditForm = {
  totalActualYield: "",
  productivityRate: "",
  totalExpectedYield: "",
  unit: "kg",
  notes: "",
};

const fieldClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

const fieldClassSm =
  "rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

const rateColor = (rate: number) => {
  if (rate >= 80) return "bg-brand-100 text-brand-700";
  if (rate >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
};

export const ProductivityPage = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<ProductivityRecord[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_ADD);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get("/productivity?limit=100"), api.get("/seasons")])
      .then(([prodRes, seasonsRes]) => {
        setRecords(Array.isArray(prodRes.data.data) ? prodRes.data.data : []);
        setSeasons(Array.isArray(seasonsRes.data.data) ? seasonsRes.data.data : []);
      })
      .catch(() => showToast("Failed to load productivity data.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        seasonId: addForm.seasonId,
        totalActualYield: Number(addForm.totalActualYield),
        productivityRate: Number(addForm.productivityRate),
      };
      if (addForm.totalExpectedYield) body.totalExpectedYield = Number(addForm.totalExpectedYield);
      if (addForm.unit.trim()) body.unit = addForm.unit.trim();
      if (addForm.notes.trim()) body.notes = addForm.notes.trim();

      const { data } = await api.post("/productivity", body);
      setRecords((prev) => [data.data, ...prev]);
      setAddForm(EMPTY_ADD);
      setShowForm(false);
      showToast("Productivity record added!", "success");
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to add record.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (rec: ProductivityRecord) => {
    setConfirmDelete(null);
    setEditingId(rec.id);
    setEditForm({
      totalActualYield: String(rec.totalActualYield),
      productivityRate: String(rec.productivityRate),
      totalExpectedYield: rec.totalExpectedYield != null ? String(rec.totalExpectedYield) : "",
      unit: rec.unit,
      notes: rec.notes ?? "",
    });
  };

  const handleUpdate = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.totalActualYield) body.totalActualYield = Number(editForm.totalActualYield);
      if (editForm.productivityRate !== "") body.productivityRate = Number(editForm.productivityRate);
      if (editForm.totalExpectedYield) body.totalExpectedYield = Number(editForm.totalExpectedYield);
      if (editForm.unit.trim()) body.unit = editForm.unit.trim();
      if (editForm.notes.trim()) body.notes = editForm.notes.trim();

      const { data } = await api.patch(`/productivity/${id}`, body);
      setRecords((prev) => prev.map((r) => (r.id === id ? data.data : r)));
      setEditingId(null);
      showToast("Record updated!", "success");
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to update record.",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/productivity/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
      showToast("Record deleted.", "success");
    } catch {
      showToast("Failed to delete record.", "error");
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
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Productivity</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            One record per season — accounts for 15% of your credit score.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setAddForm(EMPTY_ADD);
          }}
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
          <h2 className="font-bold text-stone-900 md:col-span-2 text-sm">New productivity record</h2>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Season <span className="text-red-500">*</span>
            </label>
            <select
              value={addForm.seasonId}
              onChange={(e) => setAddForm((p) => ({ ...p, seasonId: e.target.value }))}
              required
              className={fieldClass}
            >
              <option value="">— select a season —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Actual yield <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={addForm.totalActualYield}
              onChange={(e) => setAddForm((p) => ({ ...p, totalActualYield: e.target.value }))}
              placeholder="e.g. 1200"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Productivity rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={addForm.productivityRate}
              onChange={(e) => setAddForm((p) => ({ ...p, productivityRate: e.target.value }))}
              placeholder="e.g. 85.5"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Expected yield <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={addForm.totalExpectedYield}
              onChange={(e) => setAddForm((p) => ({ ...p, totalExpectedYield: e.target.value }))}
              placeholder="e.g. 1400"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Unit <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={addForm.unit}
              onChange={(e) => setAddForm((p) => ({ ...p, unit: e.target.value }))}
              placeholder="kg"
              maxLength={20}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Notes <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={addForm.notes}
              onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional details…"
              maxLength={500}
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setAddForm(EMPTY_ADD);
              }}
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
            No productivity records yet. Add one per farming season to boost your credit score.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {records.map((rec) =>
              editingId === rec.id ? (
                <form
                  key={rec.id}
                  onSubmit={(e) => handleUpdate(rec.id, e)}
                  className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <p className="md:col-span-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    {rec.season.name} {rec.season.year}
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-600">Actual yield</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={editForm.totalActualYield}
                      onChange={(e) => setEditForm((p) => ({ ...p, totalActualYield: e.target.value }))}
                      className={fieldClassSm}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-600">Productivity rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editForm.productivityRate}
                      onChange={(e) => setEditForm((p) => ({ ...p, productivityRate: e.target.value }))}
                      className={fieldClassSm}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-600">Expected yield</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editForm.totalExpectedYield}
                      onChange={(e) => setEditForm((p) => ({ ...p, totalExpectedYield: e.target.value }))}
                      className={fieldClassSm}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-600">Unit</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editForm.unit}
                      onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}
                      className={fieldClassSm}
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-medium text-stone-600">Notes</label>
                    <input
                      type="text"
                      maxLength={500}
                      value={editForm.notes}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      className={fieldClassSm}
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                    >
                      {updating ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div key={rec.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-stone-900">
                        {rec.season.name} {rec.season.year}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${rateColor(rec.productivityRate)}`}
                      >
                        {rec.productivityRate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <p className="text-sm text-stone-700">
                        {rec.totalActualYield.toLocaleString()} {rec.unit} actual
                      </p>
                      {rec.totalExpectedYield != null && (
                        <p className="text-xs text-stone-400">
                          / {rec.totalExpectedYield.toLocaleString()} {rec.unit} expected
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
                      <>
                        <button
                          onClick={() => startEdit(rec)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(rec.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
