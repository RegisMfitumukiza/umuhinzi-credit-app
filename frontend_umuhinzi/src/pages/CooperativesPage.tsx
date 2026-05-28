import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

type CoopStats = { totalMembers: number; totalLoans: number; repaymentRate: number; avgProductivity: number };
type Member = { id: string; fullName: string; email: string; status: string };

const trendPoints = "40,215 110,235 180,110 250,198 320,162 390,172 460,154 530,176 600,168";

export const CooperativesPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CoopStats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, membersRes] = await Promise.allSettled([
          api.get("/v1/cooperatives/my/stats"),
          api.get("/v1/cooperative-members/my?limit=5"),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
        if (membersRes.status === "fulfilled") setMembers(membersRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { title: "Total Members", value: loading ? "—" : stats?.totalMembers?.toLocaleString() ?? "—" },
    { title: "Group Loan Volume", value: loading ? "—" : stats ? `RWF ${(stats.totalLoans / 1_000_000).toFixed(1)}M` : "—" },
    { title: "Avg. Productivity", value: loading ? "—" : stats ? `${stats.avgProductivity?.toFixed(1)} T/Ha` : "—" },
    { title: "Repayment Rate", value: loading ? "—" : stats ? `${stats.repaymentRate?.toFixed(1)}%` : "—" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Cooperative Overview</h1>
            <p className="mt-1 text-sm text-stone-500">Monitor your group's productivity, financial health, and member performance.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/cooperatives/reports")} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Reports</button>
            <button onClick={() => navigate("/cooperatives/applications")} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Manage Loans</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{s.title}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart + Timeline */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Seasonal Productivity Trends</h2>
                <p className="text-xs text-stone-500">Historical yield data across primary crops (Tonnes/Hectare)</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">2023 Season</span>
            </div>
            <div className="relative h-[280px] rounded-xl bg-gradient-to-b from-white to-stone-50 p-4">
              <svg viewBox="0 0 640 240" className="h-full w-full">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 95, 150, 205].map((y) => <line key={y} x1="36" y1={y} x2="610" y2={y} stroke="#ececec" strokeDasharray="4 6" />)}
                <polyline points={`${trendPoints} 600,235 40,235`} fill="url(#trendFill)" stroke="none" />
                <polyline points={trendPoints} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((label, i) => (
                  <text key={label} x={40 + i * 95} y="220" textAnchor="middle" fontSize="11" fill="#a8a29e">{label}</text>
                ))}
              </svg>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Recent Members</h2>
              <button onClick={() => navigate("/cooperatives/member-list")} className="text-xs text-emerald-600 hover:underline">View All</button>
            </div>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : members.length === 0 ? (
              <p className="text-sm text-stone-400">No members found.</p>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {m.fullName?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-900">{m.fullName}</div>
                        <div className="text-xs text-stone-500">{m.email}</div>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{m.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
