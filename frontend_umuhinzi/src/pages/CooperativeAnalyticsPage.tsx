import { useEffect, useMemo, useState } from "react";
import { cooperativeMembersApi, type CooperativeMemberApi } from "../api/cooperativeMembers";
import { getLoanApplications, type LoanApplicationUi } from "../api/loanApplications";
import { getCurrentUserProfile } from "../api/users";

export const CooperativeAnalyticsPage = () => {
  const [members, setMembers] = useState<CooperativeMemberApi[]>([]);
  const [applications, setApplications] = useState<LoanApplicationUi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;
        if (!cooperativeId) return;

        const [memberRows, loanRows] = await Promise.all([
          cooperativeMembersApi.getMyCooperativeMembers().catch(() => [] as CooperativeMemberApi[]),
          getLoanApplications().catch(() => [] as LoanApplicationUi[]),
        ]);
        const memberFarmerIds = new Set(memberRows.map((m) => m.farmerId));
        setMembers(memberRows);
        setApplications(loanRows.filter((a) => a.farmerId && memberFarmerIds.has(a.farmerId)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topFarmers = useMemo(() => {
    const scoreMap = new Map<string, { name: string; score: number; apps: number }>();
    applications.forEach((a) => {
      const id = a.farmerId || a.farmer;
      const score = Number(a.scoreValue) || 0;
      const existing = scoreMap.get(id);
      if (!existing || score > existing.score) {
        scoreMap.set(id, { name: a.farmer, score, apps: (existing?.apps ?? 0) + 1 });
      } else {
        existing.apps += 1;
      }
    });
    return Array.from(scoreMap.values()).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [applications]);

  const loanStats = useMemo(() => {
    const approved = applications.filter((a) => a.status === "Approved").length;
    const rejected = applications.filter((a) => a.status === "Rejected").length;
    const pending = applications.filter((a) => a.status === "Pending" || a.status === "Under Review").length;
    const totalValue = applications.reduce((s, a) => s + (Number(String(a.amount).replace(/,/g, "")) || 0), 0);
    return { approved, rejected, pending, totalValue, total: applications.length };
  }, [applications]);

  const verificationStats = useMemo(() => ({
    active: members.filter((m) => m.status === "ACTIVE").length,
    pending: members.filter((m) => (m.status || "PENDING") === "PENDING").length,
    total: members.length,
  }), [members]);

  const approvalRate = loanStats.total > 0 ? ((loanStats.approved / loanStats.total) * 100).toFixed(1) : "0";
  const maxScore = Math.max(...topFarmers.map((f) => f.score), 100);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading cooperative analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-semibold text-stone-900">Cooperative Analytics</h2>
        <p className="mt-2 text-sm text-stone-500">Productivity rankings, loan performance, and membership verification stats.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Members", value: verificationStats.total },
          { label: "Active Members", value: verificationStats.active },
          { label: "Loan Approval Rate", value: `${approvalRate}%` },
          { label: "Total Loan Volume", value: `RWF ${loanStats.totalValue.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{s.label}</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">{s.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Top Farmers by Credit Score</h3>
          <p className="mt-1 text-sm text-stone-500">Highest scoring cooperative members</p>
          <div className="mt-5 space-y-4">
            {topFarmers.length === 0 ? (
              <p className="text-sm text-stone-500">No farmer score data available yet.</p>
            ) : topFarmers.map((farmer, i) => (
              <div key={farmer.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-stone-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    {farmer.name}
                  </span>
                  <span className="font-semibold text-stone-900">{farmer.score > 0 ? farmer.score : "—"}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(farmer.score / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Loan Performance</h3>
          <p className="mt-1 text-sm text-stone-500">Application outcomes for cooperative members</p>
          <div className="mt-5 space-y-4">
            {[
              { label: "Approved", value: loanStats.approved, color: "bg-emerald-500" },
              { label: "Pending Review", value: loanStats.pending, color: "bg-amber-400" },
              { label: "Rejected", value: loanStats.rejected, color: "bg-rose-400" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">{item.label}</span>
                  <span className="font-semibold text-stone-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: loanStats.total > 0 ? `${(item.value / loanStats.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-100 p-4 text-center">
              <p className="text-xs text-stone-500">Approval Rate</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{approvalRate}%</p>
            </div>
            <div className="rounded-xl border border-stone-100 p-4 text-center">
              <p className="text-xs text-stone-500">Total Applications</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{loanStats.total}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-900">Membership Verification Statistics</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Members", value: verificationStats.total, note: "All registered" },
            { label: "Active Members", value: verificationStats.active, note: "Verified & active" },
            { label: "Pending Approval", value: verificationStats.pending, note: "Awaiting review" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-stone-100 p-5 text-center">
              <p className="text-3xl font-semibold text-stone-900">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-stone-700">{s.label}</p>
              <p className="mt-1 text-xs text-stone-400">{s.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CooperativeAnalyticsPage;
