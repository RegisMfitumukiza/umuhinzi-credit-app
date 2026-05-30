import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import type { Farm } from "../types";
import { formatDate } from "../utils/format";

/* ── Crop interfaces (existing) ── */
interface Crop {
  id: string;
  cropName: string;
  cropType: string;
  plantingDate: string;
  expectedHarvestDate: string | null;
  estimatedArea: number | null;
  season?: { id: string; name: string; year: number };
}

interface Season {
  id: string;
  name: string;
  year: number;
}

interface CropForm {
  seasonId: string;
  cropName: string;
  cropType: string;
  plantingDate: string;
  expectedHarvestDate: string;
  estimatedArea: string;
}

/* ── Yield interfaces ── */
interface YieldRecord {
  id: string;
  cropId: string;
  actualYield: number;
  expectedYield?: number | null;
  unit?: string | null;
  harvestDate: string;
  qualityGrade?: string | null;
}

interface YieldForm {
  actualYield: string;
  expectedYield: string;
  unit: string;
  harvestDate: string;
  qualityGrade: string;
}

/* ── Input cost interfaces ── */
interface InputCost {
  id: string;
  cropId: string;
  type: string;
  name: string;
  totalCost: number;
  dateUsed: string;
}

interface InputCostForm {
  type: string;
  name: string;
  totalCost: string;
  dateUsed: string;
}

/* ── Constants ── */
const CROP_TYPES = ["CEREAL", "LEGUME", "VEGETABLE", "FRUIT", "ROOT_TUBER", "CASH_CROP", "OTHER"] as const;
const QUALITY_GRADES = ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "DAMAGED"] as const;
const INPUT_COST_TYPES = [
  "SEED", "FERTILIZER", "PESTICIDE", "HERBICIDE", "LABOR",
  "IRRIGATION", "TRANSPORT", "EQUIPMENT", "STORAGE", "OTHER",
] as const;

const CROP_BADGE: Record<string, string> = {
  CEREAL: "bg-yellow-100 text-yellow-700",
  LEGUME: "bg-green-100 text-green-700",
  VEGETABLE: "bg-emerald-100 text-emerald-700",
  FRUIT: "bg-orange-100 text-orange-700",
  ROOT_TUBER: "bg-stone-100 text-stone-600",
  CASH_CROP: "bg-blue-100 text-blue-700",
  OTHER: "bg-stone-100 text-stone-500",
};

const QUALITY_BADGE: Record<string, string> = {
  EXCELLENT: "bg-brand-100 text-brand-700",
  GOOD: "bg-green-100 text-green-700",
  AVERAGE: "bg-yellow-100 text-yellow-700",
  POOR: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-red-100 text-red-700",
};

const COST_BADGE: Record<string, string> = {
  SEED: "bg-green-100 text-green-700",
  FERTILIZER: "bg-amber-100 text-amber-700",
  PESTICIDE: "bg-red-100 text-red-700",
  HERBICIDE: "bg-orange-100 text-orange-700",
  LABOR: "bg-blue-100 text-blue-700",
  IRRIGATION: "bg-sky-100 text-sky-700",
  TRANSPORT: "bg-purple-100 text-purple-700",
  EQUIPMENT: "bg-stone-100 text-stone-700",
  STORAGE: "bg-gray-100 text-gray-700",
  OTHER: "bg-stone-100 text-stone-500",
};

const EMPTY_CROP_FORM: CropForm = {
  seasonId: "",
  cropName: "",
  cropType: "CEREAL",
  plantingDate: "",
  expectedHarvestDate: "",
  estimatedArea: "",
};

const EMPTY_YIELD_FORM: YieldForm = {
  actualYield: "",
  expectedYield: "",
  unit: "kg",
  harvestDate: "",
  qualityGrade: "",
};

const EMPTY_COST_FORM: InputCostForm = {
  type: "SEED",
  name: "",
  totalCost: "",
  dateUsed: "",
};

const fieldClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

export const FarmDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  /* ── Farm state ── */
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    sizeInHectares: "",
    soilType: "",
    irrigationType: "",
  });

  /* ── Crops state ── */
  const [crops, setCrops] = useState<Crop[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [cropForm, setCropForm] = useState<CropForm>(EMPTY_CROP_FORM);
  const [addingCrop, setAddingCrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<string | null>(null);

  /* ── Expanded crop panel state ── */
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);
  const [loadingByCrop, setLoadingByCrop] = useState<Record<string, boolean>>({});
  const [yieldsByCrop, setYieldsByCrop] = useState<Record<string, YieldRecord[]>>({});
  const [costsByCrop, setCostsByCrop] = useState<Record<string, InputCost[]>>({});

  /* ── Yield form state ── */
  const [showYieldFormFor, setShowYieldFormFor] = useState<string | null>(null);
  const [yieldForm, setYieldForm] = useState<YieldForm>(EMPTY_YIELD_FORM);
  const [addingYield, setAddingYield] = useState(false);
  const [confirmDeleteYield, setConfirmDeleteYield] = useState<string | null>(null);
  const [deletingYield, setDeletingYield] = useState<string | null>(null);

  /* ── Input cost form state ── */
  const [showCostFormFor, setShowCostFormFor] = useState<string | null>(null);
  const [costForm, setCostForm] = useState<InputCostForm>(EMPTY_COST_FORM);
  const [addingCost, setAddingCost] = useState(false);
  const [confirmDeleteCost, setConfirmDeleteCost] = useState<string | null>(null);
  const [deletingCost, setDeletingCost] = useState<string | null>(null);

  /* ── Image upload state ── */
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgUploads, setImgUploads] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/farms/${id}`)
      .then((r) => {
        const f: Farm = r.data.data;
        setFarm(f);
        setForm({
          name: f.name,
          location: f.location,
          sizeInHectares: String(f.sizeInHectares),
          soilType: f.soilType ?? "",
          irrigationType: f.irrigationType ?? "",
        });
      })
      .catch(() => {
        showToast("Farm not found.", "error");
        navigate("/farms");
      })
      .finally(() => setLoading(false));

    Promise.allSettled([
      api.get(`/crops?farmId=${id}&limit=50`),
      api.get("/seasons"),
    ]).then(([cropsRes, seasonsRes]) => {
      if (cropsRes.status === "fulfilled") {
        const d = cropsRes.value.data.data;
        setCrops(Array.isArray(d) ? d : (d?.crops ?? []));
      }
      if (seasonsRes.status === "fulfilled") {
        const d = seasonsRes.value.data.data;
        setSeasons(Array.isArray(d) ? d : (d?.seasons ?? []));
      }
    });
  }, [id, navigate, showToast]);

  /* ── Farm handlers ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/farms/${id}`, {
        name: form.name,
        location: form.location,
        sizeInHectares: Number(form.sizeInHectares),
        soilType: form.soilType || undefined,
        irrigationType: form.irrigationType || undefined,
      });
      setFarm(data.data);
      setEditing(false);
      showToast("Farm updated!", "success");
    } catch {
      showToast("Failed to update farm.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Crop handlers ── */
  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAddingCrop(true);
    try {
      const body: Record<string, unknown> = {
        farmId: id,
        seasonId: cropForm.seasonId,
        cropName: cropForm.cropName.trim(),
        cropType: cropForm.cropType,
        plantingDate: cropForm.plantingDate,
      };
      if (cropForm.expectedHarvestDate) body.expectedHarvestDate = cropForm.expectedHarvestDate;
      if (cropForm.estimatedArea) body.estimatedArea = Number(cropForm.estimatedArea);

      const { data } = await api.post("/crops", body);
      setCrops((prev) => [data.data, ...prev]);
      setCropForm(EMPTY_CROP_FORM);
      setShowAddCrop(false);
      showToast("Crop added!", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add crop.";
      showToast(msg, "error");
    } finally {
      setAddingCrop(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    setDeletingCrop(cropId);
    try {
      await api.delete(`/crops/${cropId}`);
      setCrops((prev) => prev.filter((c) => c.id !== cropId));
      setConfirmDelete(null);
      if (expandedCropId === cropId) setExpandedCropId(null);
      showToast("Crop removed.", "success");
    } catch {
      showToast("Failed to delete crop.", "error");
    } finally {
      setDeletingCrop(null);
    }
  };

  /* ── Expand / lazy-load per-crop data ── */
  const toggleCrop = (cropId: string) => {
    if (expandedCropId === cropId) {
      setExpandedCropId(null);
      return;
    }
    setExpandedCropId(cropId);
    if (yieldsByCrop[cropId] !== undefined) return; // already loaded
    setLoadingByCrop((prev) => ({ ...prev, [cropId]: true }));
    Promise.allSettled([
      api.get(`/yields?cropId=${cropId}&limit=50`),
      api.get(`/input-costs?cropId=${cropId}&limit=50`),
    ]).then(([yieldsRes, costsRes]) => {
      const yd = yieldsRes.status === "fulfilled" ? yieldsRes.value.data.data : null;
      setYieldsByCrop((prev) => ({
        ...prev,
        [cropId]: yd ? (Array.isArray(yd) ? yd : (yd.yieldRecords ?? [])) : [],
      }));
      const cd = costsRes.status === "fulfilled" ? costsRes.value.data.data : null;
      setCostsByCrop((prev) => ({
        ...prev,
        [cropId]: cd ? (Array.isArray(cd) ? cd : (cd.inputCosts ?? [])) : [],
      }));
    }).finally(() => {
      setLoadingByCrop((prev) => ({ ...prev, [cropId]: false }));
    });
  };

  /* ── Yield handlers ── */
  const handleAddYield = async (e: React.FormEvent, cropId: string) => {
    e.preventDefault();
    setAddingYield(true);
    try {
      const body: Record<string, unknown> = {
        cropId,
        actualYield: Number(yieldForm.actualYield),
        harvestDate: yieldForm.harvestDate,
      };
      if (yieldForm.expectedYield) body.expectedYield = Number(yieldForm.expectedYield);
      if (yieldForm.unit) body.unit = yieldForm.unit;
      if (yieldForm.qualityGrade) body.qualityGrade = yieldForm.qualityGrade;

      const { data } = await api.post("/yields", body);
      setYieldsByCrop((prev) => ({
        ...prev,
        [cropId]: [data.data, ...(prev[cropId] ?? [])],
      }));
      setYieldForm(EMPTY_YIELD_FORM);
      setShowYieldFormFor(null);
      showToast("Yield record added!", "success");
    } catch {
      showToast("Failed to add yield record.", "error");
    } finally {
      setAddingYield(false);
    }
  };

  const handleDeleteYield = async (yieldId: string, cropId: string) => {
    setDeletingYield(yieldId);
    try {
      await api.delete(`/yields/${yieldId}`);
      setYieldsByCrop((prev) => ({
        ...prev,
        [cropId]: (prev[cropId] ?? []).filter((y) => y.id !== yieldId),
      }));
      setConfirmDeleteYield(null);
      showToast("Yield record removed.", "success");
    } catch {
      showToast("Failed to delete yield record.", "error");
    } finally {
      setDeletingYield(null);
    }
  };

  /* ── Input cost handlers ── */
  const handleAddCost = async (e: React.FormEvent, cropId: string) => {
    e.preventDefault();
    setAddingCost(true);
    try {
      const { data } = await api.post("/input-costs", {
        cropId,
        type: costForm.type,
        name: costForm.name.trim(),
        totalCost: Number(costForm.totalCost),
        dateUsed: costForm.dateUsed,
      });
      setCostsByCrop((prev) => ({
        ...prev,
        [cropId]: [data.data, ...(prev[cropId] ?? [])],
      }));
      setCostForm(EMPTY_COST_FORM);
      setShowCostFormFor(null);
      showToast("Input cost added!", "success");
    } catch {
      showToast("Failed to add input cost.", "error");
    } finally {
      setAddingCost(false);
    }
  };

  const handleDeleteCost = async (costId: string, cropId: string) => {
    setDeletingCost(costId);
    try {
      await api.delete(`/input-costs/${costId}`);
      setCostsByCrop((prev) => ({
        ...prev,
        [cropId]: (prev[cropId] ?? []).filter((c) => c.id !== costId),
      }));
      setConfirmDeleteCost(null);
      showToast("Input cost removed.", "success");
    } catch {
      showToast("Failed to delete input cost.", "error");
    } finally {
      setDeletingCost(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB.", "error");
      return;
    }
    const fd = new FormData();
    fd.append("image", file);
    setImgUploading(true);
    try {
      const { data } = await api.post(`/uploads/farms/${id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImgUploads((prev) => [...prev, { url: data.data.url, name: file.name }]);
      showToast("Photo uploaded.", "success");
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to upload.",
        "error"
      );
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!farm) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/farms")}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← Farms
        </button>
      </div>

      {/* Farm details card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{farm.name}</h1>
            <p className="text-stone-500 text-sm mt-0.5">{farm.location}</p>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {[
              { key: "name", label: "Farm name", required: true },
              { key: "location", label: "Location", required: true },
              { key: "sizeInHectares", label: "Size (hectares)", type: "number", required: true },
              { key: "soilType", label: "Soil type" },
              { key: "irrigationType", label: "Irrigation type" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">{f.label}</label>
                <input
                  type={f.type ?? "text"}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  required={f.required}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
            ))}
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Size", value: `${farm.sizeInHectares} hectares` },
              { label: "Location", value: farm.location },
              { label: "Soil type", value: farm.soilType ?? "—" },
              { label: "Irrigation", value: farm.irrigationType ?? "—" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-stone-400 font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crops section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-stone-900">Crops</h2>
            <p className="text-xs text-stone-400 mt-0.5">{crops.length} crop{crops.length !== 1 ? "s" : ""} on this farm</p>
          </div>
          <button
            onClick={() => { setShowAddCrop((v) => !v); setCropForm(EMPTY_CROP_FORM); }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-full transition-colors"
          >
            {showAddCrop ? "Cancel" : "+ Add crop"}
          </button>
        </div>

        {/* Add crop form */}
        {showAddCrop && (
          <form onSubmit={handleAddCrop} className="px-6 py-5 border-b border-stone-100 bg-stone-50 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="font-semibold text-stone-800 md:col-span-2 text-sm">New crop</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Season</label>
              <select
                value={cropForm.seasonId}
                onChange={(e) => setCropForm((p) => ({ ...p, seasonId: e.target.value }))}
                required
                className={fieldClass}
              >
                <option value="">Select season…</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Crop name</label>
              <input
                type="text"
                value={cropForm.cropName}
                onChange={(e) => setCropForm((p) => ({ ...p, cropName: e.target.value }))}
                required
                placeholder="e.g. Maize"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Crop type</label>
              <select
                value={cropForm.cropType}
                onChange={(e) => setCropForm((p) => ({ ...p, cropType: e.target.value }))}
                className={fieldClass}
              >
                {CROP_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Planting date</label>
              <input
                type="date"
                value={cropForm.plantingDate}
                onChange={(e) => setCropForm((p) => ({ ...p, plantingDate: e.target.value }))}
                required
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Expected harvest date <span className="text-stone-400">(optional)</span></label>
              <input
                type="date"
                value={cropForm.expectedHarvestDate}
                onChange={(e) => setCropForm((p) => ({ ...p, expectedHarvestDate: e.target.value }))}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700">Area (hectares) <span className="text-stone-400">(optional)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cropForm.estimatedArea}
                onChange={(e) => setCropForm((p) => ({ ...p, estimatedArea: e.target.value }))}
                placeholder="e.g. 1.5"
                className={fieldClass}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowAddCrop(false); setCropForm(EMPTY_CROP_FORM); }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingCrop}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {addingCrop ? "Saving…" : "Save crop"}
              </button>
            </div>
          </form>
        )}

        {/* Crops list */}
        {crops.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-sm">
            No crops recorded for this farm.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {crops.map((crop) => (
              <div key={crop.id}>
                {/* Crop header row */}
                <div className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-stone-900 text-sm">{crop.cropName}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CROP_BADGE[crop.cropType] ?? "bg-stone-100 text-stone-500"}`}>
                        {crop.cropType.replace(/_/g, " ")}
                      </span>
                      {crop.season && (
                        <span className="text-xs text-stone-400">{crop.season.name} {crop.season.year}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <p className="text-xs text-stone-500">Planted {formatDate(crop.plantingDate)}</p>
                      {crop.expectedHarvestDate && (
                        <p className="text-xs text-stone-500">Harvest {formatDate(crop.expectedHarvestDate)}</p>
                      )}
                      {crop.estimatedArea != null && (
                        <p className="text-xs text-stone-500">{crop.estimatedArea} ha</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 items-center">
                    {confirmDelete === crop.id ? (
                      <>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteCrop(crop.id)}
                          disabled={deletingCrop === crop.id}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                          {deletingCrop === crop.id ? "…" : "Confirm"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(crop.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => toggleCrop(crop.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                        expandedCropId === crop.id
                          ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {expandedCropId === crop.id ? "▲ Hide" : "▼ Records"}
                    </button>
                  </div>
                </div>

                {/* Expandable records panel */}
                {expandedCropId === crop.id && (
                  <div className="border-t border-stone-100 bg-stone-50 px-6 py-5 space-y-6">
                    {loadingByCrop[crop.id] ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        {/* ── Yield Records ── */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-stone-800">
                              Yield Records
                              <span className="ml-2 text-xs font-normal text-stone-400">
                                {(yieldsByCrop[crop.id] ?? []).length}
                              </span>
                            </p>
                            <button
                              onClick={() => {
                                setShowYieldFormFor((v) => (v === crop.id ? null : crop.id));
                                setYieldForm(EMPTY_YIELD_FORM);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-full transition-colors"
                            >
                              {showYieldFormFor === crop.id ? "Cancel" : "+ Add yield"}
                            </button>
                          </div>

                          {showYieldFormFor === crop.id && (
                            <form
                              onSubmit={(e) => handleAddYield(e, crop.id)}
                              className="bg-white rounded-xl border border-stone-200 p-4 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Actual yield <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={yieldForm.actualYield}
                                  onChange={(e) => setYieldForm((p) => ({ ...p, actualYield: e.target.value }))}
                                  required
                                  placeholder="e.g. 500"
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Expected yield <span className="text-stone-400">(optional)</span></label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={yieldForm.expectedYield}
                                  onChange={(e) => setYieldForm((p) => ({ ...p, expectedYield: e.target.value }))}
                                  placeholder="e.g. 600"
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Harvest date <span className="text-red-500">*</span></label>
                                <input
                                  type="date"
                                  value={yieldForm.harvestDate}
                                  onChange={(e) => setYieldForm((p) => ({ ...p, harvestDate: e.target.value }))}
                                  required
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Unit <span className="text-stone-400">(optional)</span></label>
                                <input
                                  type="text"
                                  value={yieldForm.unit}
                                  onChange={(e) => setYieldForm((p) => ({ ...p, unit: e.target.value }))}
                                  placeholder="e.g. kg"
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-xs font-medium text-stone-700">Quality grade <span className="text-stone-400">(optional)</span></label>
                                <select
                                  value={yieldForm.qualityGrade}
                                  onChange={(e) => setYieldForm((p) => ({ ...p, qualityGrade: e.target.value }))}
                                  className={fieldClass}
                                >
                                  <option value="">— select —</option>
                                  {QUALITY_GRADES.map((g) => (
                                    <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="md:col-span-2 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => { setShowYieldFormFor(null); setYieldForm(EMPTY_YIELD_FORM); }}
                                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-full"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={addingYield}
                                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                                >
                                  {addingYield ? "Saving…" : "Save yield"}
                                </button>
                              </div>
                            </form>
                          )}

                          {(yieldsByCrop[crop.id] ?? []).length === 0 ? (
                            <p className="text-xs text-stone-400 text-center py-3">No yield records yet.</p>
                          ) : (
                            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                              {(yieldsByCrop[crop.id] ?? []).map((yr) => (
                                <div key={yr.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold text-stone-800">
                                        {yr.actualYield} {yr.unit ?? "kg"}
                                      </p>
                                      {yr.expectedYield != null && (
                                        <p className="text-xs text-stone-400">expected {yr.expectedYield} {yr.unit ?? "kg"}</p>
                                      )}
                                      {yr.qualityGrade && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${QUALITY_BADGE[yr.qualityGrade] ?? "bg-stone-100 text-stone-500"}`}>
                                          {yr.qualityGrade.charAt(0) + yr.qualityGrade.slice(1).toLowerCase()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-stone-400 mt-0.5">Harvested {formatDate(yr.harvestDate)}</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    {confirmDeleteYield === yr.id ? (
                                      <>
                                        <button
                                          onClick={() => setConfirmDeleteYield(null)}
                                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-full"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleDeleteYield(yr.id, crop.id)}
                                          disabled={deletingYield === yr.id}
                                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full"
                                        >
                                          {deletingYield === yr.id ? "…" : "Confirm"}
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteYield(yr.id)}
                                        className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-full"
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

                        {/* ── Input Costs ── */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-stone-800">
                              Input Costs
                              <span className="ml-2 text-xs font-normal text-stone-400">
                                {(costsByCrop[crop.id] ?? []).length}
                              </span>
                            </p>
                            <button
                              onClick={() => {
                                setShowCostFormFor((v) => (v === crop.id ? null : crop.id));
                                setCostForm(EMPTY_COST_FORM);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-full transition-colors"
                            >
                              {showCostFormFor === crop.id ? "Cancel" : "+ Add cost"}
                            </button>
                          </div>

                          {showCostFormFor === crop.id && (
                            <form
                              onSubmit={(e) => handleAddCost(e, crop.id)}
                              className="bg-white rounded-xl border border-stone-200 p-4 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Type <span className="text-red-500">*</span></label>
                                <select
                                  value={costForm.type}
                                  onChange={(e) => setCostForm((p) => ({ ...p, type: e.target.value }))}
                                  className={fieldClass}
                                >
                                  {INPUT_COST_TYPES.map((t) => (
                                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Name <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={costForm.name}
                                  onChange={(e) => setCostForm((p) => ({ ...p, name: e.target.value }))}
                                  required
                                  placeholder="e.g. NPK fertilizer"
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Total cost (RWF) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  min="0"
                                  value={costForm.totalCost}
                                  onChange={(e) => setCostForm((p) => ({ ...p, totalCost: e.target.value }))}
                                  required
                                  placeholder="e.g. 25000"
                                  className={fieldClass}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-stone-700">Date used <span className="text-red-500">*</span></label>
                                <input
                                  type="date"
                                  value={costForm.dateUsed}
                                  onChange={(e) => setCostForm((p) => ({ ...p, dateUsed: e.target.value }))}
                                  required
                                  className={fieldClass}
                                />
                              </div>

                              <div className="md:col-span-2 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => { setShowCostFormFor(null); setCostForm(EMPTY_COST_FORM); }}
                                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-full"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={addingCost}
                                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                                >
                                  {addingCost ? "Saving…" : "Save cost"}
                                </button>
                              </div>
                            </form>
                          )}

                          {(costsByCrop[crop.id] ?? []).length === 0 ? (
                            <p className="text-xs text-stone-400 text-center py-3">No input costs recorded.</p>
                          ) : (
                            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                              {(costsByCrop[crop.id] ?? []).map((cost) => (
                                <div key={cost.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COST_BADGE[cost.type] ?? "bg-stone-100 text-stone-500"}`}>
                                        {cost.type.charAt(0) + cost.type.slice(1).toLowerCase()}
                                      </span>
                                      <p className="text-sm font-semibold text-stone-800 truncate">{cost.name}</p>
                                    </div>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                      {cost.totalCost.toLocaleString()} RWF · {formatDate(cost.dateUsed)}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    {confirmDeleteCost === cost.id ? (
                                      <>
                                        <button
                                          onClick={() => setConfirmDeleteCost(null)}
                                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-full"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCost(cost.id, crop.id)}
                                          disabled={deletingCost === cost.id}
                                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full"
                                        >
                                          {deletingCost === cost.id ? "…" : "Confirm"}
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteCost(cost.id)}
                                        className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-full"
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
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Farm images upload */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900">Farm Photos</h2>
            <p className="text-xs text-stone-400 mt-0.5">JPEG, PNG, or WebP · max 5 MB</p>
          </div>
          <button
            onClick={() => imgInputRef.current?.click()}
            disabled={imgUploading}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
          >
            {imgUploading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {imgUploading ? "Uploading…" : "Add Photo"}
          </button>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        {imgUploads.length === 0 ? (
          <p className="text-stone-400 text-sm">No photos uploaded this session.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {imgUploads.map((u, i) => (
              <a key={i} href={u.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={u.url}
                  alt={u.name}
                  className="w-full h-32 object-cover rounded-xl border border-stone-100 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
