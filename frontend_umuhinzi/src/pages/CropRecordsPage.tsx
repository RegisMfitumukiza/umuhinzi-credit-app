import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmApi } from "../api/farms";
import { farmerApi, type FarmerCrop, type FarmerSeason } from "../api/farmer";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { isFarmerFrontendApproved } from "../utils/farmerApprovalQueue";
import type { Farm } from "../types/farm";

const cropTypes = ["CEREAL", "LEGUME", "VEGETABLE", "FRUIT", "ROOT_TUBER", "CASH_CROP", "OTHER"];

export const CropRecordsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [seasons, setSeasons] = useState<FarmerSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [form, setForm] = useState({
    farmId: "",
    seasonId: "",
    cropName: "",
    cropType: "CEREAL",
    plantingDate: "",
    expectedHarvestDate: "",
    estimatedArea: "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const [loadedCrops, loadedFarms, loadedSeasons] = await Promise.all([
          farmerApi.getCrops(),
          farmApi.listMine().then((response) => response.farms),
          farmerApi.getSeasons(),
        ]);

        const profile = await farmerApi.getProfile();
        const approvedInFrontend = isFarmerFrontendApproved(user?.id);
        setIsBlocked(profile.status === "PENDING" && !approvedInFrontend);

        setCrops(loadedCrops);
        setFarms(loadedFarms);
        setSeasons(loadedSeasons);
      } catch {
        showToast("Unable to load crop records", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast, user?.id]);

  const activeCrops = useMemo(() => crops.slice(0, 6), [crops]);
  const hasNoFarms = farms.length === 0;
  const hasNoSeasons = seasons.length === 0;

  const handleSubmit = async () => {
    if (isBlocked) {
      showToast("Your profile is pending cooperative manager approval", "error");
      return;
    }

    if (hasNoFarms) {
      showToast("Create at least one farm before adding crop records", "error");
      return;
    }

    if (hasNoSeasons) {
      showToast("No farming seasons available. Ask admin to create a season first.", "error");
      return;
    }

    if (!form.farmId || !form.seasonId || !form.cropName || !form.plantingDate) {
      showToast("Farm, season, crop name, and planting date are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      await farmerApi.createCrop({
        farmId: form.farmId,
        seasonId: form.seasonId,
        cropName: form.cropName,
        cropType: form.cropType,
        plantingDate: form.plantingDate,
        expectedHarvestDate: form.expectedHarvestDate || undefined,
        estimatedArea: form.estimatedArea ? Number(form.estimatedArea) : undefined,
      });

      const nextCrops = await farmerApi.getCrops();
      setCrops(nextCrops);
      setForm({ farmId: "", seasonId: "", cropName: "", cropType: "CEREAL", plantingDate: "", expectedHarvestDate: "", estimatedArea: "" });
      showToast("Crop record created successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create crop record", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading crop records...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Record Crops</h2>
          <p className="mt-2 text-sm text-stone-500">Log crop activity using your actual farms and seasons.</p>
        </div>
        <button onClick={() => navigate("/farmer/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">
          Back to dashboard
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Recorded crops" value={crops.length} />
        <StatCard label="Available farms" value={farms.length} />
        <StatCard label="Available seasons" value={seasons.length} />
      </section>

      {hasNoSeasons && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You cannot add crops yet because there are no farming seasons. An admin must create at least one season first.
        </section>
      )}

      {isBlocked && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Crop recording is locked while your farmer status is pending. Wait for cooperative manager approval.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-stone-900">Add Crop Record</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select disabled={isBlocked || hasNoFarms} value={form.farmId} onChange={(e) => setForm((prev) => ({ ...prev, farmId: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100">
              <option value="">Select farm</option>
              {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
            </select>
            <select disabled={isBlocked || hasNoSeasons} value={form.seasonId} onChange={(e) => setForm((prev) => ({ ...prev, seasonId: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100">
              <option value="">Select season</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.name || `Season ${season.year || ""}`}</option>)}
            </select>
            <input disabled={isBlocked || hasNoFarms || hasNoSeasons} value={form.cropName} onChange={(e) => setForm((prev) => ({ ...prev, cropName: e.target.value }))} placeholder="Crop name" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100" />
            <select disabled={isBlocked || hasNoFarms || hasNoSeasons} value={form.cropType} onChange={(e) => setForm((prev) => ({ ...prev, cropType: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100">
              {cropTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input disabled={isBlocked || hasNoFarms || hasNoSeasons} type="date" value={form.plantingDate} onChange={(e) => setForm((prev) => ({ ...prev, plantingDate: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100" />
            <input disabled={isBlocked || hasNoFarms || hasNoSeasons} type="date" value={form.expectedHarvestDate} onChange={(e) => setForm((prev) => ({ ...prev, expectedHarvestDate: e.target.value }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100" />
            <input disabled={isBlocked || hasNoFarms || hasNoSeasons} value={form.estimatedArea} onChange={(e) => setForm((prev) => ({ ...prev, estimatedArea: e.target.value }))} placeholder="Estimated area (ha)" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100" />
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => void handleSubmit()} disabled={submitting || isBlocked || hasNoFarms || hasNoSeasons} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
              {submitting ? "Saving..." : "Save Crop"}
            </button>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold text-stone-900">Recent Crop Records</h3>
          <div className="mt-4 space-y-3">
            {activeCrops.map((crop) => (
              <div key={crop.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{crop.cropName || crop.cropType || "Crop"}</p>
                    <p className="text-sm text-stone-500">{crop.farm?.name || crop.farm?.district || "Assigned farm"}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{crop.cropType || "OTHER"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span>Planted: {crop.plantingDate || "-"}</span>
                  <span>Harvest: {crop.expectedHarvestDate || "-"}</span>
                </div>
              </div>
            ))}
            {activeCrops.length === 0 && <p className="text-sm text-stone-500">No crop records yet.</p>}
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

export default CropRecordsPage;