import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

type LoanApp = { id: string; requestedAmount: number; purpose: string; status: string; createdAt: string };
type Loan = { id: string; disbursedAmount: number; status: string; interestRate: number; durationMonths: number };
type CreditScore = { score: number; tier: string };
type RepaymentSchedule = { id: string; dueDate: string; installmentAmount: number; status: string };

export const FinancialDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loanApps, setLoanApps] = useState<LoanApp[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [scoreRes, appsRes, loansRes, schedulesRes] = await Promise.allSettled([
          api.get("/v1/credit-scores/latest"),
          api.get("/v1/loan-applications?limit=5"),
          api.get("/v1/loans?status=ACTIVE&limit=3"),
          api.get("/v1/repayment-schedules?limit=5"),
        ]);
        if (scoreRes.status === "fulfilled") setCreditScore(scoreRes.value.data.data ?? null);
        if (appsRes.status === "fulfilled") setLoanApps(appsRes.value.data.data ?? []);
        if (loansRes.status === "fulfilled") setActiveLoans(loansRes.value.data.data ?? []);
        if (schedulesRes.status === "fulfilled") setSchedules(schedulesRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGenerateScore = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/v1/credit-scores/generate");
      setCreditScore(res.data.data);
    } catch {} finally {
      setGenerating(false);
    }
  };

  const totalBorrowed = activeLoans.reduce((s, l) => s + (l.disbursedAmount || 0), 0);
  const pendingApps = loanApps.filter((a) => a.status === "PENDING" || a.status === "UNDER_REVIEW").length;
  const upcomingPayment = schedules.find((s) => s.status === "PENDING");

  const scoreColor = !creditScore ? "text-gray-400" : creditScore.score >= 700 ? "text-green-600" : creditScore.score >= 500 ? "text-amber-500" : "text-red-500";
  const scoreBg = !creditScore ? "bg-gray-50" : creditScore.score >= 700 ? "bg-green-50 border-green-100" : creditScore.score >= 500 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700",
      UNDER_REVIEW: "bg-blue-50 text-blue-700",
      APPROVED: "bg-green-50 text-green-700",
      REJECTED: "bg-red-50 text-red-700",
      CANCELLED: "bg-gray-100 text-gray-500",
      ACTIVE: "bg-green-50 text-green-700",
      COMPLETED: "bg-gray-100 text-gray-500",
    };
    return map[status] ?? "bg-gray-100 text-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Dashboard › Financial Overview</p>
          <h2 className="text-2xl font-semibold text-stone-900">Financial Dashboard</h2>
          <p className="mt-1 text-sm text-stone-500">Welcome back, {user?.fullName ?? "—"}. Here's your financial summary.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Apply for Loan</button>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-2xl border p-5 shadow-sm ${scoreBg}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Credit Score</p>
          <p className={`mt-2 text-3xl font-bold ${scoreColor}`}>{loading ? "—" : creditScore?.score ?? "N/A"}</p>
          <p className="mt-1 text-xs text-stone-500">{creditScore?.tier ?? "Not generated yet"}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Active Loans</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : activeLoans.length}</p>
          <p className="mt-1 text-xs text-stone-500">RWF {loading ? "—" : totalBorrowed.toLocaleString()} borrowed</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Pending Applications</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : pendingApps}</p>
          <p className="mt-1 text-xs text-stone-500">Awaiting review</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Next Payment</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{loading ? "—" : upcomingPayment ? `RWF ${upcomingPayment.installmentAmount.toLocaleString()}` : "—"}</p>
          <p className="mt-1 text-xs text-stone-500">{upcomingPayment ? new Date(upcomingPayment.dueDate).toLocaleDateString() : "No upcoming payments"}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Loan Applications */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Recent Loan Applications</h3>
            <button onClick={() => navigate("/loans")} className="text-sm text-brand-600 hover:underline">View all →</button>
          </div>
          {loading ? <p className="text-sm text-stone-400">Loading...</p> : loanApps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-stone-400 mb-3">No loan applications yet.</p>
              <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Apply Now</button>
            </div>
          ) : (
            <div className="space-y-3">
              {loanApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-xl border border-stone-100 p-4">
                  <div>
                    <p className="font-semibold text-stone-900">RWF {app.requestedAmount?.toLocaleString()}</p>
                    <p className="text-xs text-stone-500">{app.purpose} • {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(app.status)}`}>{app.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit Score + Upcoming Payments */}
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 shadow-sm ${scoreBg}`}>
            <h3 className="text-base font-semibold text-stone-900 mb-1">Credit Score</h3>
            {creditScore ? (
              <>
                <p className={`text-5xl font-bold mt-2 ${scoreColor}`}>{creditScore.score}</p>
                <p className="mt-1 text-sm text-stone-600">Tier: <span className="font-semibold">{creditScore.tier}</span></p>
                <button onClick={handleGenerateScore} disabled={generating} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60 transition">
                  {generating ? "Recalculating..." : "Recalculate Score"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 mt-2">No credit score generated yet.</p>
                <button onClick={handleGenerateScore} disabled={generating} className="mt-4 w-full rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition">
                  {generating ? "Generating..." : "Generate Score"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Upcoming Payments</h3>
              <button onClick={() => navigate("/payments")} className="text-xs text-brand-600 hover:underline">View all →</button>
            </div>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : schedules.filter((s) => s.status === "PENDING").length === 0 ? (
              <p className="text-sm text-stone-400">No upcoming payments.</p>
            ) : (
              <div className="space-y-2">
                {schedules.filter((s) => s.status === "PENDING").slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm rounded-lg border border-stone-100 p-3">
                    <span className="text-stone-600">{new Date(s.dueDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-stone-900">RWF {s.installmentAmount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
