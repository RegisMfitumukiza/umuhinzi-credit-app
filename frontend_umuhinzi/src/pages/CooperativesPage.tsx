import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cooperativeApi, type CooperativeProfile } from "../api/cooperatives";
import { cooperativeMembersApi, type CooperativeMemberApi } from "../api/cooperativeMembers";
import { getLoanApplications, type LoanApplicationUi } from "../api/loanApplications";
import { getCurrentUserProfile } from "../api/users";

const parseAmount = (value?: string) => {
  if (!value) return 0;
  return Number(value.replace(/,/g, "")) || 0;
};

export const CooperativesPage = () => {
  const [loading, setLoading] = useState(true);
  const [cooperative, setCooperative] = useState<CooperativeProfile | null>(null);
  const [members, setMembers] = useState<CooperativeMemberApi[]>([]);
  const [applications, setApplications] = useState<LoanApplicationUi[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;

        if (!cooperativeId) {
          setCooperative(null);
          setMembers([]);
          setApplications([]);
          return;
        }

        const [cooperatives, memberRows, loanRows] = await Promise.all([
          cooperativeApi.getAllCooperatives().catch(() => [] as CooperativeProfile[]),
          cooperativeMembersApi.getMyCooperativeMembers().catch(() => [] as CooperativeMemberApi[]),
          getLoanApplications().catch(() => [] as LoanApplicationUi[]),
        ]);

        const currentCooperative = cooperatives.find((item) => item.id === cooperativeId) || null;
        const memberFarmerIds = new Set(memberRows.map((member) => member.farmerId));
        const filteredApplications = loanRows.filter((application) => application.farmerId ? memberFarmerIds.has(application.farmerId) : false);

        setCooperative(currentCooperative);
        setMembers(memberRows);
        setApplications(filteredApplications);
      } catch {
        setCooperative(null);
        setMembers([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    const activeMembers = members.filter((member) => (member.status || "PENDING").toUpperCase() === "ACTIVE").length;
    const pendingMembers = members.filter((member) => (member.status || "PENDING").toUpperCase() === "PENDING").length;
    const approvedApplications = applications.filter((application) => application.status === "Approved").length;
    const totalLoanVolume = applications.reduce((sum, application) => sum + parseAmount(application.amount), 0);
    const scoreValues = applications.map((application) => Number(application.scoreValue)).filter((value) => Number.isFinite(value) && value > 0);
    const averageScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0;

    return {
      totalMembers: members.length,
      activeMembers,
      pendingMembers,
      applications: applications.length,
      approvedApplications,
      totalLoanVolume,
      averageScore,
    };
  }, [applications, members]);

  const monthlyTrend = useMemo(() => {
    const monthBuckets = new Map<string, number>();

    applications.forEach((application) => {
      if (!application.createdAt) return;
      const date = new Date(application.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthBuckets.set(key, (monthBuckets.get(key) || 0) + 1);
    });

    return Array.from(monthBuckets.entries()).slice(-6).map(([label, value]) => ({ label, value }));
  }, [applications]);

  const recentApplications = useMemo(
    () => [...applications].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5),
    [applications]
  );

  const recentMembers = useMemo(
    () => [...members].slice(0, 5),
    [members]
  );

  const maxTrendValue = Math.max(...monthlyTrend.map((item) => item.value), 1);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading cooperative data...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Cooperative Overview</h1>
            <p className="mt-1 text-sm text-stone-500">Live view for your cooperative members, applications, and loan activity.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/cooperatives/profile" className="rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
              Create / Update Profile
            </Link>
            <Link to="/cooperatives/reports" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
              Reports
            </Link>
            <Link to="/cooperatives/applications" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">
              Manage Loans
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-emerald-900">Cooperative profile and approval</div>
              <p className="mt-1 text-sm text-emerald-900/75">
                {cooperative
                  ? `Your cooperative profile is ${cooperative.status || "PENDING"}. Farmers can only select it when the admin approves it.`
                  : "Create or link your cooperative profile first so farmers can select it from their profile page."}
              </p>
            </div>
            <Link to="/cooperatives/profile" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
              Go to Profile
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Members" value={summary.totalMembers} delta={summary.pendingMembers > 0 ? `${summary.pendingMembers} pending` : "All active"} accent="blue" />
          <StatCard title="Loan Applications" value={summary.applications} delta={`${summary.approvedApplications} approved`} accent="green" />
          <StatCard title="Total Loan Volume" value={`RWF ${summary.totalLoanVolume.toLocaleString()}`} delta="Live cooperative data" accent="orange" />
          <StatCard title="Avg. Credit Score" value={summary.averageScore ? String(summary.averageScore) : "N/A"} delta="From member applications" accent="emerald" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Loan Application Trend</h2>
                <p className="text-xs text-stone-500">Applications submitted by your cooperative members in the last months available in the database</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">Live</span>
            </div>

            {monthlyTrend.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-sm text-stone-500">
                No loan applications are linked to your cooperative members yet.
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyTrend.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-700">{item.label}</span>
                      <span className="font-semibold text-stone-900">{item.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(item.value / maxTrendValue) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Member Status</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600">Database</span>
            </div>

            <div className="space-y-3">
              <StatusLine label="Active Members" value={summary.activeMembers} />
              <StatusLine label="Pending Members" value={summary.pendingMembers} />
              <StatusLine label="Total Cooperative Records" value={summary.totalMembers} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Recent Applications</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Live</span>
            </div>

            <div className="space-y-3">
              {recentApplications.length === 0 && <p className="text-sm text-stone-500">No live applications are available for this cooperative yet.</p>}
              {recentApplications.map((application) => (
                <div key={application.id} className="rounded-xl border border-stone-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{application.farmer}</div>
                      <div className="text-xs text-stone-500">{application.crop} • {application.institution || "No institution"}</div>
                      <div className="mt-1 text-xs text-stone-400">Submitted: {application.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-stone-900">RWF {application.amount}</div>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${application.status === "Approved" ? "bg-emerald-100 text-emerald-700" : application.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Members</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Latest</span>
            </div>

            <div className="space-y-3">
              {recentMembers.length === 0 && <p className="text-sm text-stone-500">No members found for your cooperative.</p>}
              {recentMembers.map((member) => (
                <div key={member.id} className="rounded-xl border border-stone-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{member.farmer?.user?.fullName || "Farmer"}</div>
                      <div className="text-xs text-stone-500">{member.farmer?.user?.email || "-"}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${member.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : member.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                      {member.status || "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-emerald-500 bg-emerald-500 p-6 text-white shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Next Actions From Live Data</h3>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Keep members active, review their loan applications, and maintain your cooperative approval so farmers can keep selecting it.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/cooperatives/members" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700">View Members</Link>
                <Link to="/cooperatives/applications" className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">Review Applications</Link>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/20 bg-white/10 px-6 py-4 text-center">
              <div className="text-4xl font-semibold">{summary.activeMembers}</div>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-emerald-50">Active Members</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, delta, accent }: { title: string; value: string | number; delta: string; accent: "blue" | "green" | "orange" | "emerald" }) => {
  const accentClasses = {
    blue: "from-blue-50 to-white text-blue-600",
    green: "from-emerald-50 to-white text-emerald-600",
    orange: "from-orange-50 to-white text-orange-600",
    emerald: "from-emerald-50 to-white text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-b p-5 shadow-sm" style={{ backgroundImage: `linear-gradient(to bottom, white, white), linear-gradient(to bottom, var(--tw-gradient-stops))` }}>
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accentClasses[accent].split(" ").slice(0, 2).join(" ")}`}>+</div>
        <span className="rounded-full border border-stone-200 px-2 py-1 text-[11px] text-stone-500">↗ {delta}</span>
      </div>
      <div className="text-sm text-stone-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-stone-900">{value}</div>
    </div>
  );
};

const StatusLine = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
    <div className="text-sm text-stone-600">{label}</div>
    <div className="text-lg font-semibold text-stone-900">{value}</div>
  </div>
);

export default CooperativesPage;
