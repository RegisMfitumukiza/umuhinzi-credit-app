import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { farmerApi } from "../api/farmer";
import { farmApi } from "../api/farms";
import { FarmForm } from "../components/FarmForm";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isFarmerFrontendApproved } from "../utils/farmerApprovalQueue";
import type { Farm, FarmFormValues, FarmQuery, FarmStatus } from "../types/farm";

export const FarmListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFarm, setCreatingFarm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FarmStatus | "">("");
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get("new") === "1");
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const { showToast } = useToast();

  useEffect(() => {
    setShowCreateForm(searchParams.get("new") === "1");
  }, [searchParams]);

  const loadFarms = async (query: FarmQuery = {}) => {
    setLoading(true);
    try {
      const response = await farmApi.listMine({ page, limit: 10, search, status: status || undefined, ...query });
      setFarms(response.farms);
      setMeta(response.meta);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load farms", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
    
  }, [page]);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await farmerApi.getProfile();
        const approvedInFrontend = isFarmerFrontendApproved(user?.id);
        setIsBlocked(profile.status === "PENDING" && !approvedInFrontend);
      } catch {
        setIsBlocked(false);
      }
    })();
  }, [user?.id]);

  const openCreateForm = () => {
    const next = new URLSearchParams(searchParams);
    next.set("new", "1");
    setSearchParams(next);
  };

  const closeCreateForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next);
  };

  const handleCreateFarm = async (values: FarmFormValues) => {
    if (isBlocked) {
      showToast("Your profile is pending cooperative manager approval", "error");
      return;
    }

    setCreatingFarm(true);
    try {
      await farmApi.create(values);
      showToast("Farm created successfully", "success");
      closeCreateForm();
      setPage(1);
      await loadFarms({ page: 1 });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create farm", "error");
    } finally {
      setCreatingFarm(false);
    }
  };

  const handleFilter = async () => {
    setPage(1);
    await loadFarms({ page: 1 });
  };

  const handleDelete = async (farmId: string) => {
    const confirmed = window.confirm("Delete this farm? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await farmApi.remove(farmId);
      showToast("Farm deleted successfully", "success");
      await loadFarms();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete farm", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-panel lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Farms</h1>
          <p className="text-sm text-stone-600">Search, filter, and paginate farm records.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800">
          Create farm
        </button>
      </div>

      {showCreateForm && (
        <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-900">Add new farm</h2>
            <button type="button" onClick={closeCreateForm} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">
              Close form
            </button>
          </div>

          {isBlocked && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Access blocked while your farmer status is pending. Wait for cooperative manager approval.
            </p>
          )}

          {!isBlocked && !creatingFarm ? <FarmForm submitLabel="Create farm" onSubmit={handleCreateFarm} /> : null}
          {creatingFarm ? <p className="text-sm text-stone-500">Creating farm...</p> : null}
        </section>
      )}

      <section className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-panel md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, district, sector..."
          className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as FarmStatus | "")} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-500">
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <button onClick={handleFilter} className="rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white">
          Apply filters
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-panel">
        {loading ? (
          <p className="p-6 text-sm text-stone-500">Loading farms...</p>
        ) : farms.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No farms match the current filters.</div>
        ) : (
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Farm</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Land</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {farms.map((farm) => (
                <tr key={farm.id} className="hover:bg-brand-50/40">
                  <td className="px-6 py-4">
                    <Link to={`/farms/${farm.id}`} className="font-semibold text-brand-800 hover:underline">{farm.name}</Link>
                  </td>
                  <td className="px-6 py-4 text-stone-600">{farm.sector}, {farm.district}</td>
                  <td className="px-6 py-4 text-stone-600">{farm.landSize} {farm.landUnit}</td>
                  <td className="px-6 py-4"><StatusBadge status={farm.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/farms/${farm.id}`} className="rounded-full border border-stone-200 px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50">View</Link>
                      <Link to={`/farms/${farm.id}/edit`} className="rounded-full border border-brand-200 px-3 py-1.5 font-semibold text-brand-700 hover:bg-brand-50">Edit</Link>
                      <button type="button" onClick={() => void handleDelete(farm.id)} className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
};
