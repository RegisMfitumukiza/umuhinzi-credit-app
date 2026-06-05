import { useEffect, useMemo, useState } from "react";
import { cooperativeMembersApi, type CooperativeMemberApi } from "../api/cooperativeMembers";
import { getLoanApplications, type LoanApplicationUi } from "../api/loanApplications";
import { getCurrentUserProfile } from "../api/users";

const parseAmount = (value?: string) => {
  if (!value) return 0;
  return Number(value.replace(/,/g, "")) || 0;
};

export const CooperativeReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<CooperativeMemberApi[]>([]);
  const [applications, setApplications] = useState<LoanApplicationUi[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;

        if (!cooperativeId) {
          setMembers([]);
          setApplications([]);
          return;
        }

        const [memberRows, loanRows] = await Promise.all([
          cooperativeMembersApi.getMyCooperativeMembers().catch(() => [] as CooperativeMemberApi[]),
          getLoanApplications().catch(() => [] as LoanApplicationUi[]),
        ]);

        const farmerIds = new Set(memberRows.map((member) => member.farmerId));
        const filteredApplications = loanRows.filter((application) => application.farmerId ? farmerIds.has(application.farmerId) : false);

        setMembers(memberRows);
        setApplications(filteredApplications);
      } catch {
        setMembers([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const totalLoanVolume = applications.reduce((sum, application) => sum + parseAmount(application.amount), 0);
    const approvedApplications = applications.filter((application) => application.status === "Approved").length;
    const rejectedApplications = applications.filter((application) => application.status === "Rejected").length;
    const pendingApplications = applications.filter((application) => application.status === "Pending" || application.status === "Under Review").length;
    const activeMembers = members.filter((member) => (member.status || "PENDING").toUpperCase() === "ACTIVE").length;
    const scoreValues = applications.map((application) => Number(application.scoreValue)).filter((value) => Number.isFinite(value) && value > 0);
    const averageScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0;

    return {
      totalLoanVolume,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
      activeMembers,
      averageScore,
    };
  }, [applications, members]);

  const topApplications = useMemo(
    () => [...applications].sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount)).slice(0, 5),
    [applications]
  );

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((application) => {
      map.set(application.status, (map.get(application.status) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [applications]);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading cooperative reports...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">All figures below are loaded from the cooperative’s live records.</p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Filter Views</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Share Dashboard</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Loan Volume" value={`RWF ${metrics.totalLoanVolume.toLocaleString()}`} tone="+live" />
          <StatCard label="Approved Applications" value={metrics.approvedApplications} tone="database" />
          <StatCard label="Pending Applications" value={metrics.pendingApplications} tone="database" />
          <StatCard label="Average Credit Score" value={metrics.averageScore || "N/A"} tone="backend" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.65fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Application Status Breakdown</h2>
                <p className="text-xs text-stone-500">Current cooperative loan applications by status</p>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Live</div>
            </div>

            {statusBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">No loan applications linked to this cooperative yet.</div>
            ) : (
              <div className="space-y-4">
                {statusBreakdown.map(([status, count]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-700">{status}</span>
                      <span className="font-semibold text-stone-900">{count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${status === "Approved" ? "bg-emerald-500" : status === "Rejected" ? "bg-rose-500" : status === "Under Review" ? "bg-amber-500" : "bg-stone-500"}`} style={{ width: `${Math.max(15, (count / applications.length) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm text-center">
              <div className="text-sm text-stone-500">Active Members</div>
              <div className="mt-4 text-3xl font-semibold text-stone-900">{metrics.activeMembers}</div>
              <div className="mt-1 text-xs text-stone-500">member records</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900">Top Cooperative Applications</h3>
                <button className="text-xs text-stone-500">Export</button>
              </div>
              <div className="space-y-2">
                {topApplications.length === 0 && <div className="rounded-xl border border-dashed border-stone-200 p-3 text-sm text-stone-500">No application data available.</div>}
                {topApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2">
                    <div className="text-sm text-stone-900">{application.farmer}</div>
                    <div className="text-sm font-semibold text-stone-900">RWF {application.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Latest Applications</h2>
              <button className="text-xs text-stone-500">View cooperative table</button>
            </div>

            <div className="space-y-2">
              {topApplications.length === 0 && <p className="text-sm text-stone-500">No live application records available.</p>}
              {topApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{application.farmer}</div>
                    <div className="text-xs text-stone-500">{application.crop} • {application.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-stone-900">{application.status}</div>
                    <div className="text-xs text-stone-500">RWF {application.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Export Engine</h3>
            <p className="mt-1 text-xs text-stone-500">The values here are real  records ready for download or sharing.</p>
            <div className="mt-3 space-y-3 text-sm text-stone-600">
              <div className="rounded-xl border border-stone-100 px-3 py-2">Member records loaded: {members.length}</div>
              <div className="rounded-xl border border-stone-100 px-3 py-2">Application records loaded: {applications.length}</div>
              <div className="rounded-xl border border-stone-100 px-3 py-2">Rejected applications: {metrics.rejectedApplications}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: string | number; tone: string }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div className="text-sm text-stone-500">{label}</div>
      <span className="rounded-full border border-stone-200 px-2 py-1 text-[11px] text-stone-500">{tone}</span>
    </div>
    <div className="text-2xl font-semibold text-stone-900">{value}</div>
  </div>
);

export default CooperativeReportsPage;
