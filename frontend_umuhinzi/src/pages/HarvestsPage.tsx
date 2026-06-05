import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmerApi, type FarmerCrop, type FarmerYield } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const qualityGrades = ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "DAMAGED"];

export const HarvestsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [harvests, setHarvests] = useState<FarmerYield[]>([]);
  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    cropId: "",
    actualYield: "",
    expectedYield: "",
    unit: "kg",
    harvestDate: "",
    qualityGrade: "EXCELLENT",
  });

  useEffect(() => {
    void (async () => {
      try {
        const [loadedHarvests, loadedCrops] = await Promise.all([
          farmerApi.getYields(),
          farmerApi.getCrops(),
        ]);

        setHarvests(loadedHarvests);
        setCrops(loadedCrops);
      } catch {
        showToast("Unable to load harvest records", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const recentHarvests = useMemo(() => harvests.slice(0, 6), [harvests]);

  const handleSubmit = async () => {
    if (!form.cropId || !form.actualYield || !form.harvestDate) {
      showToast("Crop, actual yield, and harvest date are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      await farmerApi.createYield({
        cropId: form.cropId,
        actualYield: Number(form.actualYield),
        expectedYield: form.expectedYield ? Number(form.expectedYield) : undefined,
        unit: form.unit,
        harvestDate: form.harvestDate,
        qualityGrade: form.qualityGrade,
      });

      const nextHarvests = await farmerApi.getYields();
      setHarvests(nextHarvests);
      setForm({ cropId: "", actualYield: "", expectedYield: "", unit: "kg", harvestDate: "", qualityGrade: "EXCELLENT" });
      showToast("Harvest record saved successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save harvest record", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading harvest records...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Track Harvests</h2>
          <p className="mt-2 text-sm text-stone-500">Log real yield records for your crops.</p>
        </div>
        <button onClick={() => navigate("/farmer/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">
          Back to dashboard
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Harvest records" value={harvests.length} />
        <StatCard label="Crops available" value={crops.length} />
        <StatCard label="Quality grades" value={qualityGrades.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-stone-900">Add Harvest Record</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select value={form.cropId} onChange={(e) => setForm((prev) => ({ ...prev, cropId: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
              <option value="">Select crop</option>
              {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.cropName || crop.cropType || crop.id}</option>)}
            </select>
            <input type="number" value={form.actualYield} onChange={(e) => setForm((prev) => ({ ...prev, actualYield: e.target.value }))} placeholder="Actual yield" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            <input type="number" value={form.expectedYield} onChange={(e) => setForm((prev) => ({ ...prev, expectedYield: e.target.value }))} placeholder="Expected yield" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            <input value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} placeholder="Unit" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            <input type="date" value={form.harvestDate} onChange={(e) => setForm((prev) => ({ ...prev, harvestDate: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            <select value={form.qualityGrade} onChange={(e) => setForm((prev) => ({ ...prev, qualityGrade: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
              {qualityGrades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => void handleSubmit()} disabled={submitting} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
              {submitting ? "Saving..." : "Save Harvest"}
            </button>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold text-stone-900">Recent Harvest Records</h3>
          <div className="mt-4 space-y-3">
            {recentHarvests.map((record) => (
              <div key={record.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{record.crop?.cropName || "Harvest record"}</p>
                    <p className="text-sm text-stone-500">{record.crop?.farm?.name || "Crop backend record"}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{record.qualityGrade || "EXCELLENT"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span>{record.harvestDate || "-"}</span>
                  <span>{record.actualYield || 0} {record.unit || "kg"}</span>
                </div>
              </div>
            ))}
            {recentHarvests.length === 0 && <p className="text-sm text-stone-500">No harvest records yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</p>
    <h3 className="mt-2 text-3xl font-semibold text-stone-900">{value}</h3>
  </div>
);

export default HarvestsPage;