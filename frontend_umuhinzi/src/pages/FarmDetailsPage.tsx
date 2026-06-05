import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { farmApi } from "../api/farms";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../context/ToastContext";
import type { Farm } from "../types/farm";

export const FarmDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const response = await farmApi.getById(id);
        setFarm(response);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load farm", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, showToast]);

  const handleDelete = async () => {
    if (!farm) return;

    const confirmed = window.confirm(`Delete ${farm.name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await farmApi.remove(farm.id);
      showToast("Farm deleted successfully", "success");
      navigate("/farms");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete farm", "error");
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading farm...</p>;
  }

  if (!farm) {
    return <p className="text-sm text-stone-500">Farm not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-3xl bg-white p-6 shadow-panel">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">{farm.name}</h1>
          <p className="mt-2 text-sm text-stone-600">{farm.village}, {farm.cell}, {farm.sector}, {farm.district}</p>
        </div>
        <StatusBadge status={farm.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Land size", `${farm.landSize} ${farm.landUnit}`],
          ["Ownership", farm.ownershipType],
          ["Soil type", farm.soilType],
          ["Province", farm.province],
          // ["Latitude", farm.latitude?.toString() ?? "-"] ,
          // ["Longitude", farm.longitude?.toString() ?? "-"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to={`/farms/${farm.id}/edit`} className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white">Edit farm</Link>
        <button type="button" onClick={() => void handleDelete()} className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">Delete farm</button>
        <Link to="/farms" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700">Back to farms</Link>
      </div>
    </div>
  );
};
