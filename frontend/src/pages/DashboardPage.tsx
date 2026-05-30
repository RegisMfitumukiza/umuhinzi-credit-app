import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate, getInitials } from "../utils/format";
import type { CreditScore, LoanApplication, Loan, RepaymentSchedule } from "../types";

interface DashboardData {
  creditScore: CreditScore | null;
  applications: LoanApplication[];
  activeLoans: Loan[];
  upcomingPayments: RepaymentSchedule[];
}

const ratingColor = (rating: string) => {
  switch (rating) {
    case "EXCELLENT": return "text-brand-600";
    case "GOOD": return "text-blue-600";
    case "FAIR": return "text-yellow-600";
    case "POOR": return "text-orange-600";
    default: return "text-red-600";
  }
};

const FACTOR_MAX: Record<string, number> = {
  YIELD_CONSISTENCY: 200,
  REPAYMENT_BEHAVIOR: 200,
  INCOME_STABILITY: 150,
  PRODUCTIVITY: 150,
  FARMING_HISTORY: 100,
  FARM_SIZE: 50,
  LIVESTOCK_VALUE: 50,
  COOPERATIVE_MEMBERSHIP: 50,
  DATA_COMPLETENESS: 50,
};

const factorLabel = (key: string) =>
  key
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");

const factorBarColor = (pct: number) => {
  if (pct >= 75) return "bg-brand-500";
  if (pct >= 50) return "bg-blue-400";
  if (pct >= 25) return "bg-yellow-400";
  return "bg-red-400";
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    UNDER_REVIEW: "bg-blue-100 text-blue-700",
    APPROVED: "bg-brand-100 text-brand-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-stone-100 text-stone-500",
    ACTIVE: "bg-brand-100 text-brand-700",
    DISBURSED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-stone-100 text-stone-600",
    DEFAULTED: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-stone-100 text-stone-600";
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    creditScore: null,
    applications: [],
    activeLoans: [],
    upcomingPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [scoreRes, appsRes, loansRes, paymentsRes] = await Promise.allSettled([
        api.get("/credit-scores/latest"),
        api.get("/loan-applications?limit=5"),
        api.get("/loans?status=ACTIVE&limit=3"),
        api.get("/repayment-schedules?limit=5"),
      ]);

      setData({
        creditScore:
          scoreRes.status === "fulfilled" ? scoreRes.value.data.data : null,
        applications:
          appsRes.status === "fulfilled"
            ? appsRes.value.data.data.loanApplications ?? []
            : [],
        activeLoans:
          loansRes.status === "fulfilled"
            ? loansRes.value.data.data.loans ?? []
            : [],
        upcomingPayments:
          paymentsRes.status === "fulfilled"
            ? paymentsRes.value.data.data.repaymentSchedules ?? []
            : [],
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const generateScore = async () => {
    setGenerating(true);
    try {
      const { data: res } = await api.post("/credit-scores/generate");
      setData((prev) => ({ ...prev, creditScore: res.data }));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg flex-shrink-0">
          {user ? getInitials(user.fullName) : "?"}
        </div>
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Hello, {user?.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-stone-500 text-sm">Here's your financial overview</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Credit score</p>
          {data.creditScore ? (
            <>
              <p className="text-2xl font-black text-stone-900 mt-1">{data.creditScore.score}</p>
              <p className={`text-xs font-semibold mt-0.5 ${ratingColor(data.creditScore.rating)}`}>
                {data.creditScore.rating}
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-400 mt-1">Not generated</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Active loans</p>
          <p className="text-2xl font-black text-stone-900 mt-1">{data.activeLoans.length}</p>
          <p className="text-xs text-stone-400 mt-0.5">current</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Applications</p>
          <p className="text-2xl font-black text-stone-900 mt-1">{data.applications.length}</p>
          <p className="text-xs text-stone-400 mt-0.5">submitted</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <p className="text-xs text-stone-500 font-medium">Next payment</p>
          {data.upcomingPayments.length > 0 ? (
            <>
              <p className="text-lg font-black text-stone-900 mt-1">
                {formatCurrency(data.upcomingPayments[0].amount)}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {formatDate(data.upcomingPayments[0].dueDate)}
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-400 mt-1">None due</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Credit Score widget */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-stone-900">Credit Score</h2>
            <button
              onClick={generateScore}
              disabled={generating}
              className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60"
            >
              {generating ? "Generating…" : "Recalculate"}
            </button>
          </div>
          {data.creditScore ? (
            <div className="flex flex-col items-center py-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e7e5e4" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${(data.creditScore.score / 1000) * 100} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-stone-900">{data.creditScore.score}</span>
                  <span className="text-xs text-stone-400">/ 1000</span>
                </div>
              </div>
              <span className={`mt-3 font-bold text-sm ${ratingColor(data.creditScore.rating)}`}>
                {data.creditScore.rating}
              </span>
              <p className="text-xs text-stone-400 mt-1">
                Calculated {formatDate(data.creditScore.calculatedAt)}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm mb-4">No score yet</p>
              <button
                onClick={generateScore}
                disabled={generating}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full disabled:opacity-60"
              >
                {generating ? "Generating…" : "Generate score"}
              </button>
            </div>
          )}
        </div>

        {/* Loan applications */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-stone-900">Loan Applications</h2>
            <button
              onClick={() => navigate("/loans")}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>
          {data.applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm mb-4">No applications yet</p>
              <button
                onClick={() => navigate("/loans")}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full"
              >
                Apply for a loan
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      {formatCurrency(app.requestedAmount)}
                    </p>
                    <p className="text-xs text-stone-400">{app.purpose}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Credit score factor breakdown */}
      {data.creditScore?.factorBreakdown &&
        Object.keys(data.creditScore.factorBreakdown).length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-stone-900">Score Breakdown</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                How each factor contributes to your 1,000-point score
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {Object.entries(data.creditScore.factorBreakdown)
                .sort(([a], [b]) => (FACTOR_MAX[b] ?? 50) - (FACTOR_MAX[a] ?? 50))
                .map(([key, value]) => {
                  const max = FACTOR_MAX[key] ?? 100;
                  const pct = Math.min((value / max) * 100, 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-stone-700">
                          {factorLabel(key)}
                        </span>
                        <span className="text-xs font-semibold text-stone-500">
                          {value}{" "}
                          <span className="text-stone-300 font-normal">/ {max} pts</span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${factorBarColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Upcoming payments */}
      {data.upcomingPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-stone-900">Upcoming Payments</h2>
            <button
              onClick={() => navigate("/payments")}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {data.upcomingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-stone-400">Due {formatDate(p.dueDate)}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
