import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface MarketPrice {
  id: string;
  cropName: string;
  marketLocation: string;
  pricePerUnit: number;
  unit: string | null;
  recordedAt: string | null;
  createdAt: string;
}

// ─── Price Modal (Create / Edit) ──────────────────────────────────────────────

interface PriceModalProps {
  price: MarketPrice | null;
  onClose: () => void;
  onSaved: (saved: MarketPrice, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}

const PriceModal = ({ price, onClose, onSaved, onDeleted }: PriceModalProps) => {
  const { showToast } = useToast();
  const [cropName, setCropName] = useState(price?.cropName ?? "");
  const [marketLocation, setMarketLocation] = useState(price?.marketLocation ?? "");
  const [pricePerUnit, setPricePerUnit] = useState(price?.pricePerUnit?.toString() ?? "");
  const [unit, setUnit] = useState(price?.unit ?? "kg");
  const [recordedAt, setRecordedAt] = useState(price?.recordedAt?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isEdit = price !== null;

  const handleSave = async () => {
    const parsed = parseFloat(pricePerUnit);
    if (!cropName.trim() || !marketLocation.trim() || isNaN(parsed) || parsed <= 0) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      cropName: cropName.trim(),
      marketLocation: marketLocation.trim(),
      pricePerUnit: parsed,
    };
    if (unit.trim()) body.unit = unit.trim();
    if (recordedAt) body.recordedAt = new Date(recordedAt).toISOString();

    try {
      const r = price
        ? await api.patch(`/market-prices/${price.id}`, body)
        : await api.post("/market-prices", body);
      onSaved(r.data.data, !isEdit);
      showToast(isEdit ? "Price updated." : "Price created.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to save."
          : "Failed to save.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!price) return;
    setDeleting(true);
    try {
      await api.delete(`/market-prices/${price.id}`);
      onDeleted(price.id);
      showToast("Price deleted.", "success");
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
        <div>
          <h2 className="text-base font-black text-stone-900">
            {isEdit ? "Edit market price" : "Add market price"}
          </h2>
          {isEdit && (
            <p className="text-xs text-stone-400 mt-0.5">
              {price.cropName} — {price.marketLocation}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Crop name <span className="text-red-400">*</span>
            </label>
            <input
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Maize"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Market location <span className="text-red-400">*</span>
            </label>
            <input
              value={marketLocation}
              onChange={(e) => setMarketLocation(e.target.value)}
              placeholder="e.g. Kigali market"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Price / unit <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="0"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Unit
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Recorded date (optional)
            </label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create price"}
          </button>
        </div>

        {/* Delete section (edit mode only) */}
        {isEdit && (
          <div className="border-t border-stone-100 pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
              >
                Delete price
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600 text-center font-medium">
                  This will permanently delete this price record.
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
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminMarketPricesPage = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [managing, setManaging] = useState<MarketPrice | null | undefined>(undefined);

  useEffect(() => {
    api
      .get("/market-prices?limit=100")
      .then((r) => setPrices(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prices.filter(
    (p) =>
      !search ||
      p.cropName.toLowerCase().includes(search.toLowerCase()) ||
      p.marketLocation.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = (saved: MarketPrice, isNew: boolean) => {
    if (isNew) {
      setPrices((prev) => [saved, ...prev]);
    } else {
      setPrices((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    }
  };

  const handleDeleted = (id: string) => {
    setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Market Prices</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Manage crop market prices visible to farmers
          </p>
        </div>
        <button
          onClick={() => setManaging(null)}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors"
        >
          + Add price
        </button>
      </div>

      {/* Filter */}
      <div>
        <input
          type="text"
          placeholder="Search crop or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No market prices found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Crop", "Market location", "Price / unit", "Unit", "Recorded", "Added", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left text-xs font-semibold text-stone-400 px-4 py-3"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-stone-900">{p.cropName}</td>
                  <td className="px-4 py-3 text-stone-500">{p.marketLocation}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {p.pricePerUnit.toLocaleString()} RWF
                  </td>
                  <td className="px-4 py-3 text-stone-500">{p.unit ?? "kg"}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {p.recordedAt ? formatDate(p.recordedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManaging(p)}
                      className="text-xs font-semibold text-stone-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-full border border-stone-200 hover:border-brand-200 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {managing !== undefined && (
        <PriceModal
          price={managing}
          onClose={() => setManaging(undefined)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};
