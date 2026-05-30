import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

interface FarmingSeason {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// ─── Create Season Modal ──────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (season: FarmingSeason) => void;
}

const CreateSeasonModal = ({ onClose, onCreated }: CreateModalProps) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!name.trim() || !year || !startDate || !endDate) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      showToast("Please enter a valid year.", "error");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      showToast("End date must be after start date.", "error");
      return;
    }

    setSaving(true);
    try {
      const r = await api.post("/seasons", {
        name: name.trim(),
        year: parsedYear,
        startDate,
        endDate,
      });
      onCreated(r.data.data);
      showToast("Season created successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Failed to create season."
          : "Failed to create season.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-black text-stone-900">Add farming season</h2>
          <p className="text-xs text-stone-400 mt-0.5">Create a new planting / harvest season</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Season name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Season A 2025"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Year <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Start date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                End date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
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
            {saving ? "Creating…" : "Create season"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminSeasonsPage = () => {
  const [seasons, setSeasons] = useState<FarmingSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api
      .get("/seasons")
      .then((r) => setSeasons(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (season: FarmingSeason) => {
    setSeasons((prev) => [season, ...prev]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Farming Seasons</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Define planting seasons used across the platform
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors"
        >
          + Add season
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : seasons.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No farming seasons yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Season", "Year", "Start date", "End date", "Added"].map((h, i) => (
                  <th
                    key={i}
                    className="text-left text-xs font-semibold text-stone-400 px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-stone-900">{s.name}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">{s.year}</td>
                  <td className="px-4 py-3 text-stone-500">{formatDate(s.startDate)}</td>
                  <td className="px-4 py-3 text-stone-500">{formatDate(s.endDate)}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateSeasonModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};
