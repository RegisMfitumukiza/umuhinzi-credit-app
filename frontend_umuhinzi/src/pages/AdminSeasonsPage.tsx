import { useEffect, useState } from "react";
import { farmerApi, type FarmerSeason } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const currentYear = new Date().getFullYear();

export const AdminSeasonsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seasons, setSeasons] = useState<FarmerSeason[]>([]);
  const [form, setForm] = useState({
    name: "Season A",
    year: String(currentYear),
    startDate: "",
    endDate: "",
  });

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const data = await farmerApi.getSeasons();
      setSeasons(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load seasons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSeasons();
  }, []);

  const handleCreateSeason = async () => {
    if (!form.name.trim() || !form.year.trim() || !form.startDate || !form.endDate) {
      showToast("Season name, year, start date and end date are required", "error");
      return;
    }

    const parsedYear = Number(form.year);
    if (Number.isNaN(parsedYear)) {
      showToast("Year must be a valid number", "error");
      return;
    }

    setSaving(true);
    try {
      await farmerApi.createSeason({
        name: form.name.trim(),
        year: parsedYear,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      showToast("Season created successfully", "success");
      setForm({
        name: "Season A",
        year: String(currentYear),
        startDate: "",
        endDate: "",
      });
      await loadSeasons();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create season", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">Farming Seasons</h1>
          <p className="mt-2 text-sm text-stone-500">
            Create seasons here so farmers can record crop data.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Season name (e.g. Season A)"
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
            <input
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
              placeholder="Year"
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void handleCreateSeason()}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-70"
            >
              {saving ? "Creating..." : "Create season"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Available Seasons</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              {seasons.length} total
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Loading seasons...</p>
          ) : seasons.length === 0 ? (
            <p className="text-sm text-stone-500">No seasons yet. Create your first season above.</p>
          ) : (
            <div className="space-y-3">
              {seasons.map((season) => (
                <div key={season.id} className="rounded-xl border border-stone-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{season.name} {season.year}</p>
                      <p className="text-sm text-stone-500">
                        {season.startDate ? new Date(season.startDate).toLocaleDateString() : "-"} - {" "}
                        {season.endDate ? new Date(season.endDate).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminSeasonsPage;
