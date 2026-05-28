import { useEffect, useState } from "react";
import { api } from "../api/http";

type Crop = { id: string; cropName: string; cropType: string };
type InputCost = {
  id: string;
  type: string;
  name: string;
  totalCost: number;
  dateUsed: string;
  crop?: { cropName: string };
};

const COST_TYPES = ["SEED", "FERTILIZER", "PESTICIDE", "HERBICIDE", "LABOR", "IRRIGATION", "TRANSPORT", "EQUIPMENT", "STORAGE", "OTHER"];

const typeBadge: Record<string, string> = {
  SEED: "bg-green-50 text-green-700",
  FERTILIZER: "bg-lime-50 text-lime-700",
  PESTICIDE: "bg-red-50 text-red-700",
  HERBICIDE: "bg-orange-50 text-orange-700",
  LABOR: "bg-blue-50 text-blue-700",
  IRRIGATION: "bg-cyan-50 text-cyan-700",
  TRANSPORT: "bg-purple-50 text-purple-700",
  EQUIPMENT: "bg-amber-50 text-amber-700",
  STORAGE: "bg-stone-100 text-stone-600",
  OTHER: "bg-gray-100 text-gray-600",
};

export const InputCostsPage = () => {
  const [costs, setCosts] = useState<InputCost[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ cropId: "", type: "SEED", name: "", totalCost: "", dateUsed: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [costsRes, cropsRes] = await Promise.allSettled([
        api.get("/v1/input-costs?limit=50"),
        api.get("/v1/crops?limit=100"),
      ]);
      if (costsRes.status === "fulfilled") setCosts(costsRes.value.data.data ?? []);
      if (cropsRes.status === "fulfilled") setCrops(cropsRes.value.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.cropId || !form.name || !form.totalCost || !form.dateUsed) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/v1/input-costs", {
        cropId: form.cropId,
        type: form.type,
        name: form.name,
        totalCost: Number(form.totalCost),
        dateUsed: form.dateUsed,
      });
      setForm({ cropId: "", type: "SEED", name: "", totalCost: "", dateUsed: "" });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to add input cost.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this input cost record?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/v1/input-costs/${id}`);
      setCosts((prev) => prev.filter((c) => c.id !== id));
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const totalSpend = costs.reduce((s, c) => s + (c.totalCost || 0), 0);
  const byType = COST_TYPES.map((t) => ({
    type: t,
    total: costs.filter((c) => c.type === t).reduce((s, c) => s + c.totalCost, 0),
  })).filter((t) => t.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Input Costs</h2>
          <p className="mt-1 text-sm text-stone-500">Track farming input expenses across your crops.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
          {showForm ? "Cancel" : "+ Add Cost"}
        </button>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Total Spend</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : `RWF ${totalSpend.toLocaleString()}`}</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Total Records</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : costs.length}</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Cost Categories</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : byType.length}</p>
        </article>
      </section>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel space-y-4">
          <h3 className="font-semibold text-stone-900">New Input Cost</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Crop</span>
              <select value={form.cropId} onChange={(e) => setForm({ ...form, cropId: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="">Select crop...</option>
                {crops.map((c) => <option key={c.id} value={c.id}>{c.cropName} ({c.cropType})</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Cost Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
                {COST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Name / Description</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DAP Fertilizer 50kg" className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Total Cost (RWF)</span>
              <input type="number" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} placeholder="e.g. 25000" className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Date Used</span>
              <input type="date" value={form.dateUsed} onChange={(e) => setForm({ ...form, dateUsed: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
        {/* Records list */}
        <div>
          {loading ? <p className="text-sm text-stone-400">Loading...</p> : costs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">
              No input cost records yet. Add your first record above.
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-panel">
              <table className="min-w-full divide-y divide-stone-100 text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-[0.2em] text-stone-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Crop</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white text-stone-700">
                  {costs.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-4 font-medium text-stone-900">{c.name}</td>
                      <td className="px-4 py-4 text-stone-500">{c.crop?.cropName ?? "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeBadge[c.type] ?? "bg-gray-100 text-gray-600"}`}>{c.type}</span>
                      </td>
                      <td className="px-4 py-4 text-stone-500">{new Date(c.dateUsed).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-semibold text-stone-900">RWF {c.totalCost?.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                          {deletingId === c.id ? "..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Spend by type */}
        {byType.length > 0 && (
          <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-base font-semibold text-stone-900 mb-4">Spend by Type</h3>
            <div className="space-y-3">
              {byType.sort((a, b) => b.total - a.total).map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-xs text-stone-600 mb-1">
                    <span>{t.type}</span>
                    <span className="font-semibold">RWF {t.total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(t.total / totalSpend) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </section>
    </div>
  );
};
