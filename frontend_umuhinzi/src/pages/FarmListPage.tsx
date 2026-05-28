import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { farmApi } from "../api/farms";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import type { Farm, FarmQuery, FarmStatus } from "../types/farm";

export const FarmListPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FarmStatus | "">("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const loadFarms = async (query: FarmQuery = {}) => {
    setLoading(true);
    try {
      const response = await farmApi.listMine({ page, limit: 10, search, status: status || undefined, ...query });
      setFarms(response.farms);
      setMeta(response.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = async () => {
    setPage(1);
    await loadFarms({ page: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-panel lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Farms</h1>
          <p className="text-sm text-stone-600">Search, filter, and paginate farm records.</p>
        </div>
        <Link to="/farms/new" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800">
          Create farm
        </Link>
      </div>

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
