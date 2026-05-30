import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import type { Farm, Livestock } from "../types";

const LIVESTOCK_TYPES = [
  "CATTLE", "GOAT", "SHEEP", "PIG", "CHICKEN", "DUCK", "RABBIT", "FISH", "BEE", "OTHER",
] as const;

const LIVESTOCK_PURPOSES = [
  "MILK", "MEAT", "EGGS", "BREEDING", "FARM_WORK", "COMMERCIAL", "OTHER",
] as const;

const LIVESTOCK_BADGE: Record<string, string> = {
  CATTLE: "bg-amber-100 text-amber-800",
  GOAT: "bg-stone-100 text-stone-700",
  SHEEP: "bg-gray-100 text-gray-700",
  PIG: "bg-pink-100 text-pink-700",
  CHICKEN: "bg-yellow-100 text-yellow-800",
  DUCK: "bg-sky-100 text-sky-700",
  RABBIT: "bg-purple-100 text-purple-700",
  FISH: "bg-blue-100 text-blue-700",
  BEE: "bg-amber-50 text-amber-900",
  OTHER: "bg-stone-100 text-stone-600",
};

interface LivestockForm {
  type: string;
  purpose: string;
  quantity: string;
  estimatedValue: string;
}

const EMPTY_LIVESTOCK_FORM: LivestockForm = {
  type: "CATTLE",
  purpose: "",
  quantity: "",
  estimatedValue: "",
};

interface Season {
  id: string;
  name: string;
  year: number;
}

interface ProductivityRecord {
  id: string;
  seasonId: string;
  season?: { id: string; name: string; year: number };
  totalActualYield: number;
  totalExpectedYield?: number | null;
  unit?: string | null;
  productivityRate: number;
}

interface ProductivityForm {
  seasonId: string;
  totalActualYield: string;
  totalExpectedYield: string;
  unit: string;
  productivityRate: string;
}

const EMPTY_PRODUCTIVITY_FORM: ProductivityForm = {
  seasonId: "",
  totalActualYield: "",
  totalExpectedYield: "",
  unit: "kg",
  productivityRate: "",
};

const rateBarColor = (rate: number) => {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 60) return "bg-amber-400";
  if (rate >= 40) return "bg-orange-400";
  return "bg-red-500";
};

const rateTextColor = (rate: number) => {
  if (rate >= 80) return "text-emerald-700";
  if (rate >= 60) return "text-amber-700";
  if (rate >= 40) return "text-orange-700";
  return "text-red-700";
};

export const FarmsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Farms state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    sizeInHectares: "",
    soilType: "",
    irrigationType: "",
  });

  // Livestock state
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [showLivestockForm, setShowLivestockForm] = useState(false);
  const [savingLivestock, setSavingLivestock] = useState(false);
  const [livestockForm, setLivestockForm] = useState<LivestockForm>(EMPTY_LIVESTOCK_FORM);
  const [confirmDeleteLivestock, setConfirmDeleteLivestock] = useState<string | null>(null);
  const [deletingLivestock, setDeletingLivestock] = useState<string | null>(null);

  // Productivity state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [productivity, setProductivity] = useState<ProductivityRecord[]>([]);
  const [showProductivityForm, setShowProductivityForm] = useState(false);
  const [savingProductivity, setSavingProductivity] = useState(false);
  const [productivityForm, setProductivityForm] = useState<ProductivityForm>(EMPTY_PRODUCTIVITY_FORM);
  const [confirmDeleteProductivity, setConfirmDeleteProductivity] = useState<string | null>(null);
  const [deletingProductivity, setDeletingProductivity] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get("/farms/me"),
      api.get("/livestock"),
      api.get("/seasons"),
      api.get("/productivity"),
    ]).then(([farmsRes, livestockRes, seasonsRes, productivityRes]) => {
      if (farmsRes.status === "fulfilled") {
        setFarms(farmsRes.value.data.data.farms ?? []);
      } else {
        showToast("Failed to load farms.", "error");
      }
      if (livestockRes.status === "fulfilled") {
        const d = livestockRes.value.data.data;
        setLivestock(Array.isArray(d) ? d : (d?.livestock ?? []));
      }
      if (seasonsRes.status === "fulfilled") {
        const d = seasonsRes.value.data.data;
        setSeasons(Array.isArray(d) ? d : []);
      }
      if (productivityRes.status === "fulfilled") {
        const d = productivityRes.value.data.data;
        setProductivity(Array.isArray(d) ? d : (d?.productivityRecords ?? []));
      }
    }).finally(() => setLoading(false));
  }, [showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/farms", {
        name: form.name,
        location: form.location,
        sizeInHectares: Number(form.sizeInHectares),
        soilType: form.soilType || undefined,
        irrigationType: form.irrigationType || undefined,
      });
      setFarms((prev) => [data.data, ...prev]);
      setForm({ name: "", location: "", sizeInHectares: "", soilType: "", irrigationType: "" });
      setShowForm(false);
      showToast("Farm added!", "success");
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Failed to add farm.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLivestock(true);
    try {
      const payload: Record<string, unknown> = { type: livestockForm.type };
      if (livestockForm.purpose) payload.purpose = livestockForm.purpose;
      if (livestockForm.quantity) payload.quantity = Number(livestockForm.quantity);
      if (livestockForm.estimatedValue) payload.estimatedValue = Number(livestockForm.estimatedValue);
      const { data } = await api.post("/livestock", payload);
      setLivestock((prev) => [data.data, ...prev]);
      setLivestockForm(EMPTY_LIVESTOCK_FORM);
      setShowLivestockForm(false);
      showToast("Livestock added!", "success");
    } catch {
      showToast("Failed to add livestock.", "error");
    } finally {
      setSavingLivestock(false);
    }
  };

  const handleDeleteLivestock = async (id: string) => {
    setDeletingLivestock(id);
    try {
      await api.delete(`/livestock/${id}`);
      setLivestock((prev) => prev.filter((l) => l.id !== id));
      setConfirmDeleteLivestock(null);
      showToast("Livestock removed.", "success");
    } catch {
      showToast("Failed to delete livestock.", "error");
    } finally {
      setDeletingLivestock(null);
    }
  };

  const handleAddProductivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProductivity(true);
    try {
      const payload: Record<string, unknown> = {
        seasonId: productivityForm.seasonId,
        totalActualYield: Number(productivityForm.totalActualYield),
        productivityRate: Number(productivityForm.productivityRate),
      };
      if (productivityForm.totalExpectedYield) payload.totalExpectedYield = Number(productivityForm.totalExpectedYield);
      if (productivityForm.unit) payload.unit = productivityForm.unit;
      const { data } = await api.post("/productivity", payload);
      setProductivity((prev) => [data.data, ...prev]);
      setProductivityForm(EMPTY_PRODUCTIVITY_FORM);
      setShowProductivityForm(false);
      showToast("Productivity record added!", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err &&
        err.response && typeof err.response === "object" && "data" in err.response &&
        err.response.data && typeof err.response.data === "object" && "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Failed to add productivity record.";
      showToast(msg, "error");
    } finally {
      setSavingProductivity(false);
    }
  };

  const handleDeleteProductivity = async (id: string) => {
    setDeletingProductivity(id);
    try {
      await api.delete(`/productivity/${id}`);
      setProductivity((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteProductivity(null);
      showToast("Productivity record removed.", "success");
    } catch {
      showToast("Failed to delete productivity record.", "error");
    } finally {
      setDeletingProductivity(null);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Farms ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Farms</h1>
          <p className="text-stone-500 text-sm mt-0.5">{farms.length} farm{farms.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {showForm ? "Cancel" : "+ Add farm"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="font-bold text-stone-900 md:col-span-2">New Farm</h2>

          {[
            { key: "name", label: "Farm name", placeholder: "Nyagatare Farm", required: true },
            { key: "location", label: "Location", placeholder: "Nyagatare, Eastern Province", required: true },
            { key: "sizeInHectares", label: "Size (hectares)", placeholder: "2.5", required: true, type: "number" },
            { key: "soilType", label: "Soil type", placeholder: "e.g. Clay loam" },
            { key: "irrigationType", label: "Irrigation type", placeholder: "e.g. Rainfed" },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                required={f.required}
                placeholder={f.placeholder}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          ))}

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
            >
              {saving ? "Saving…" : "Save farm"}
            </button>
          </div>
        </form>
      )}

      {farms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No farms yet</p>
          <p className="text-stone-400 text-sm mt-1">Add your first farm to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div
              key={farm.id}
              onClick={() => navigate(`/farms/${farm.id}`)}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900">{farm.name}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{farm.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{farm.sizeInHectares} ha</p>
                </div>
              </div>
              {farm.soilType && (
                <p className="text-xs text-stone-400 mt-3">Soil: {farm.soilType}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Livestock ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Livestock</h2>
            <p className="text-stone-500 text-sm mt-0.5">
              {livestock.length} record{livestock.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowLivestockForm((v) => !v)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {showLivestockForm ? "Cancel" : "+ Add livestock"}
          </button>
        </div>

        {showLivestockForm && (
          <form
            onSubmit={handleAddLivestock}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h3 className="font-bold text-stone-900 md:col-span-2">New Livestock Record</h3>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Type <span className="text-red-500">*</span></label>
              <select
                value={livestockForm.type}
                onChange={(e) => setLivestockForm((p) => ({ ...p, type: e.target.value }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                {LIVESTOCK_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Purpose <span className="text-stone-400 font-normal">(optional)</span></label>
              <select
                value={livestockForm.purpose}
                onChange={(e) => setLivestockForm((p) => ({ ...p, purpose: e.target.value }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">— select —</option>
                {LIVESTOCK_PURPOSES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).replace(/_/g, " ").toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Quantity <span className="text-stone-400 font-normal">(optional)</span></label>
              <input
                type="number"
                min="1"
                value={livestockForm.quantity}
                onChange={(e) => setLivestockForm((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="e.g. 10"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Estimated value */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Estimated value (RWF) <span className="text-stone-400 font-normal">(optional)</span></label>
              <input
                type="number"
                min="0"
                value={livestockForm.estimatedValue}
                onChange={(e) => setLivestockForm((p) => ({ ...p, estimatedValue: e.target.value }))}
                placeholder="e.g. 500000"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowLivestockForm(false); setLivestockForm(EMPTY_LIVESTOCK_FORM); }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingLivestock}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {savingLivestock ? "Saving…" : "Save livestock"}
              </button>
            </div>
          </form>
        )}

        {livestock.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center shadow-sm">
            <p className="text-stone-400 font-medium">No livestock records yet</p>
            <p className="text-stone-400 text-sm mt-1">Add your livestock to improve your credit score.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {livestock.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${LIVESTOCK_BADGE[item.type] ?? "bg-stone-100 text-stone-600"}`}
                  >
                    {item.type.charAt(0) + item.type.slice(1).toLowerCase()}
                  </span>
                  <div className="min-w-0">
                    {item.purpose && (
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {item.purpose.charAt(0) + item.purpose.slice(1).replace(/_/g, " ").toLowerCase()}
                      </p>
                    )}
                    <p className="text-xs text-stone-500">
                      {item.quantity != null ? `${item.quantity} head` : "qty not set"}
                      {item.estimatedValue != null ? ` · ${item.estimatedValue.toLocaleString()} RWF` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {confirmDeleteLivestock === item.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteLivestock(null)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteLivestock(item.id)}
                        disabled={deletingLivestock === item.id}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full transition-colors"
                      >
                        {deletingLivestock === item.id ? "…" : "Confirm"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteLivestock(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-full transition-colors"
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

      {/* ── Seasonal Productivity ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Seasonal Productivity</h2>
            <p className="text-stone-500 text-sm mt-0.5">
              {productivity.length} record{productivity.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowProductivityForm((v) => !v)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {showProductivityForm ? "Cancel" : "+ Add record"}
          </button>
        </div>

        {showProductivityForm && (
          <form
            onSubmit={handleAddProductivity}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h3 className="font-bold text-stone-900 md:col-span-2">New Productivity Record</h3>

            {/* Season select */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-stone-700">
                Season <span className="text-red-500">*</span>
              </label>
              {seasons.length === 0 ? (
                <p className="text-sm text-stone-400 italic py-2">
                  No seasons available yet. Ask your cooperative admin to create a farming season first.
                </p>
              ) : (
                <select
                  value={productivityForm.seasonId}
                  onChange={(e) => setProductivityForm((p) => ({ ...p, seasonId: e.target.value }))}
                  required
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                >
                  <option value="">— select a season —</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Total actual yield */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Total actual yield <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productivityForm.totalActualYield}
                onChange={(e) => setProductivityForm((p) => ({ ...p, totalActualYield: e.target.value }))}
                required
                placeholder="e.g. 2500"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Productivity rate */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Productivity rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={productivityForm.productivityRate}
                onChange={(e) => setProductivityForm((p) => ({ ...p, productivityRate: e.target.value }))}
                required
                placeholder="e.g. 85.5"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Expected yield */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Expected yield <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productivityForm.totalExpectedYield}
                onChange={(e) => setProductivityForm((p) => ({ ...p, totalExpectedYield: e.target.value }))}
                placeholder="e.g. 3000"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Unit <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={productivityForm.unit}
                onChange={(e) => setProductivityForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="kg"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowProductivityForm(false); setProductivityForm(EMPTY_PRODUCTIVITY_FORM); }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProductivity || seasons.length === 0}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {savingProductivity ? "Saving…" : "Save record"}
              </button>
            </div>
          </form>
        )}

        {productivity.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center shadow-sm">
            <p className="text-stone-400 font-medium">No productivity records yet</p>
            <p className="text-stone-400 text-sm mt-1">Add a seasonal productivity record to track your farm performance.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {productivity.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-stone-800 text-sm">
                      {item.season ? `${item.season.name} (${item.season.year})` : "Season"}
                    </span>
                    <span className={`text-xs font-bold ${rateTextColor(item.productivityRate)}`}>
                      {item.productivityRate}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden w-full max-w-xs">
                    <div
                      className={`h-full rounded-full ${rateBarColor(item.productivityRate)}`}
                      style={{ width: `${Math.min(100, item.productivityRate)}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    Actual:{" "}
                    <span className="font-medium text-stone-700">
                      {item.totalActualYield.toLocaleString()} {item.unit ?? "kg"}
                    </span>
                    {item.totalExpectedYield != null && (
                      <>
                        {" · "}Expected:{" "}
                        <span className="font-medium text-stone-700">
                          {item.totalExpectedYield.toLocaleString()} {item.unit ?? "kg"}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {confirmDeleteProductivity === item.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteProductivity(null)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteProductivity(item.id)}
                        disabled={deletingProductivity === item.id}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full transition-colors"
                      >
                        {deletingProductivity === item.id ? "…" : "Confirm"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteProductivity(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-full transition-colors"
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
