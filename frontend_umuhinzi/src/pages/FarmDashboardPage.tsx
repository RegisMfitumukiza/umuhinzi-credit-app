import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

type Farm = { id: string; name: string; landSize: number; landUnit: string; district: string; province: string; status: string };
type Livestock = { id: string; type: string; count: number; healthStatus: string };
type CreditScore = { score: number; tier: string };

export const FarmDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [farmsRes, livestockRes, scoreRes] = await Promise.allSettled([
          api.get("/v1/farms/me"),
          api.get("/v1/livestock/me"),
          api.get("/v1/credit-scores/me"),
        ]);
        if (farmsRes.status === "fulfilled") setFarms(farmsRes.value.data.data ?? []);
        if (livestockRes.status === "fulfilled") setLivestock(livestockRes.value.data.data ?? []);
        if (scoreRes.status === "fulfilled") setCreditScore(scoreRes.value.data.data ?? null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalLand = farms.reduce((sum, f) => sum + (f.landSize || 0), 0);
  const totalLivestock = livestock.reduce((sum, l) => sum + (l.count || 0), 0);
  const initials = user?.fullName ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Dashboard › Farm Management</p>
        <h2 className="text-2xl font-semibold text-stone-900">Farmer Profile & Farm Management</h2>
      </div>

      {/* Profile card */}
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {user?.profileImageUrl
              ? <img src={user.profileImageUrl} className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-100" alt="avatar" />
              : <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-500 ring-4 ring-brand-100 flex items-center justify-center text-white text-2xl font-bold">{initials}</div>}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-stone-900">{user?.fullName ?? "—"}</h3>
                {creditScore && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Credit Tier: {creditScore.tier}</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <span>{user?.email}</span>
                {user?.phone && <span>{user.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/account")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Edit Profile</button>
            <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Apply for Loan</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Total land managed</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{loading ? "—" : `${totalLand.toFixed(1)} Ha`}</h3>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Registered farms</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{loading ? "—" : farms.length}</h3>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Verified livestock</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{loading ? "—" : `${totalLivestock} Heads`}</h3>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        {/* Farms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-stone-900">Registered Farm Plots</h3>
            <button onClick={() => navigate("/farms/new")} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">+ Add Farm</button>
          </div>

          {loading ? (
            <p className="text-sm text-stone-400">Loading farms...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {farms.map((farm) => (
                <article key={farm.id} className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-panel">
                  <div className="h-36 bg-gradient-to-br from-green-400 to-emerald-700" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-stone-900">{farm.name}</h4>
                        <p className="mt-1 text-sm text-stone-500">{farm.landSize} {farm.landUnit}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${farm.status === "ACTIVE" ? "bg-brand-50 text-brand-700" : "bg-stone-100 text-stone-500"}`}>{farm.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-stone-500">{farm.district}, {farm.province}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <button onClick={() => navigate(`/farms/${farm.id}`)} className="font-semibold text-brand-600">Details →</button>
                      <button onClick={() => navigate(`/farms/${farm.id}/edit`)} className="text-stone-400 hover:text-stone-600">Edit</button>
                    </div>
                  </div>
                </article>
              ))}
              <article onClick={() => navigate("/farms/new")} className="flex min-h-[14rem] cursor-pointer items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-6 text-center shadow-panel hover:border-brand-400 transition">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl text-stone-500">+</div>
                  <h4 className="mt-4 text-lg font-semibold text-stone-900">Add New Farm Plot</h4>
                  <p className="mt-2 text-sm text-stone-500">Register land to improve your credit score.</p>
                </div>
              </article>
            </div>
          )}
        </div>

        {/* Livestock + Credit Score */}
        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Livestock Ledger</h3>
              <button onClick={() => navigate("/livestock")} className="text-sm font-semibold text-brand-600">View all →</button>
            </div>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : livestock.length === 0 ? (
              <p className="text-sm text-stone-400">No livestock records yet.</p>
            ) : (
              <div className="space-y-3">
                {livestock.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-stone-900">{item.type}</p>
                        <p className="text-sm text-stone-500">{item.count} Heads</p>
                      </div>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.healthStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {creditScore && (
            <section className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-brand-700">Credit Score</h3>
              <p className="mt-3 text-4xl font-bold text-stone-900">{creditScore.score}</p>
              <p className="mt-1 text-sm text-brand-700">Tier: {creditScore.tier}</p>
              <button onClick={() => navigate("/loans")} className="mt-4 w-full rounded-full bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Apply for Loan</button>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};
