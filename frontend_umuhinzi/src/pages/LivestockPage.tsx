import { useEffect, useState } from "react";
import { api } from "../api/http";

type Livestock = { id: string; type: string; count: number; healthStatus: string; notes?: string; createdAt: string };

export const LivestockPage = () => {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", count: "", healthStatus: "GOOD", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/v1/livestock/me");
      setLivestock(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.type || !form.count) { setError("Type and count are required."); return; }
    setSaving(true);
    try {
      await api.post("/v1/livestock", { type: form.type, count: Number(form.count), healthStatus: form.healthStatus, notes: form.notes || undefined });
      setForm({ type: "", count: "", healthStatus: "GOOD", notes: "" });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to add livestock.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this livestock record?")) return;
    try {
      await api.delete(`/v1/livestock/${id}`);
      setLivestock((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Livestock</h2>
          <p className="mt-1 text-sm text-stone-500">Manage your livestock records.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
          {showForm ? "Cancel" : "+ Add Livestock"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel space-y-4">
          <h3 className="font-semibold text-stone-900">New Livestock Record</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Type</span>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Cattle, Goats" className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Count</span>
              <input type="number" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Health Status</span>
              <select value={form.healthStatus} onChange={(e) => setForm({ ...form, healthStatus: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Notes (optional)</span>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-stone-400">Loading...</p> : livestock.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">
          No livestock records yet. Add your first record above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {livestock.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-stone-900">{item.type}</h4>
                  <p className="mt-1 text-sm text-stone-500">{item.count} Heads</p>
                  {item.notes && <p className="mt-2 text-xs text-stone-400">{item.notes}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.healthStatus === "EXCELLENT" ? "bg-green-50 text-green-700" :
                  item.healthStatus === "GOOD" ? "bg-brand-50 text-brand-700" :
                  item.healthStatus === "FAIR" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                  {item.healthStatus}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
