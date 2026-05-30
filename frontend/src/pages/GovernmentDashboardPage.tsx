import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { formatDate } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformData {
  farmers: { total: number };
  loans: {
    total: number;
    totalDisbursedAmount: number;
    byStatus: Record<string, number>;
  };
  repayments: {
    total: number;
    totalAmountRepaid: number;
  };
  creditScores: { averageScore: number | null };
  institutions: { activeCount: number };
  cooperatives: { activeCount: number };
  recentLoans: Array<{
    id: string;
    principalAmount: number;
    status: string;
    createdAt: string;
    farmer: { id: string; user: { fullName: string } };
  }>;
}

interface RegionalData {
  farmersByProvince: Array<{ province: string | null; farmerCount: number }>;
  farmersByDistrict: Array<{ district: string | null; farmerCount: number }>;
  loansByDistrict: Array<{
    district: string | null;
    loanCount: number;
    applicationCount: number;
  }>;
  creditScoresByProvince: Array<{
    province: string;
    averageScore: number;
    scoredFarmers: number;
  }>;
}

interface AnalyticsReport {
  id: string;
  reportType: string;
  title: string;
  description?: string;
  visibility: string;
  generatedAt: string;
  generatedBy: { fullName: string };
}

interface FarmerAnalytics {
  farmer: { id: string; fullName: string; email: string };
  loanApplications: { total: number };
  loans: { total: number; byStatus: Record<string, number> };
  repayments: { totalAmountRepaid: number };
  repaymentSchedules: { total: number; overdue: number };
  creditScore: { score: number; riskLevel: string; createdAt: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtRWF = (n: number) =>
  `RWF ${Math.round(n).toLocaleString("en-US")}`;

const loanStatusColor: Record<string, string> = {
  APPROVED: "bg-blue-100 text-blue-700",
  DISBURSED: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-stone-100 text-stone-600",
  DEFAULTED: "bg-red-100 text-red-700",
};

const reportTypeLabel: Record<string, string> = {
  FARMER_GROWTH: "Farmer Growth",
  PRODUCTIVITY: "Productivity",
  LOAN_ANALYTICS: "Loan Analytics",
  REGIONAL_PERFORMANCE: "Regional Performance",
  FINANCIAL_INCLUSION: "Financial Inclusion",
  REPAYMENT_PERFORMANCE: "Repayment Performance",
  COOPERATIVE_PERFORMANCE: "Cooperative Performance",
};

const visibilityColor: Record<string, string> = {
  ADMIN_ONLY: "bg-stone-100 text-stone-600",
  GOVERNMENT_PARTNER: "bg-orange-100 text-orange-700",
  INSTITUTION: "bg-blue-100 text-blue-700",
  COOPERATIVE: "bg-purple-100 text-purple-700",
  PUBLIC_SUMMARY: "bg-brand-100 text-brand-700",
};

const riskLevelColor: Record<string, string> = {
  LOW: "bg-brand-100 text-brand-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  VERY_HIGH: "bg-red-100 text-red-700",
};

// ─── Farmer Drill-Down Modal ──────────────────────────────────────────────────

const FarmerDrillDownModal = ({
  farmerId,
  onClose,
}: {
  farmerId: string;
  onClose: () => void;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<FarmerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get(`/analytics/farmer/${farmerId}`)
      .then((r) => setData(r.data.data as FarmerAnalytics))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [farmerId]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">Farmer Analytics</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        )}

        {failed && (
          <p className="text-center text-stone-400 text-sm py-12">
            Failed to load farmer analytics.
          </p>
        )}

        {data && (
          <div className="p-5 space-y-4">
            {/* Farmer identity */}
            <div>
              <p className="font-black text-stone-900 text-lg">{data.farmer.fullName}</p>
              <p className="text-stone-400 text-sm">{data.farmer.email}</p>
            </div>

            {/* Credit score */}
            {data.creditScore ? (
              <div className="bg-stone-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Credit Score
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-stone-900">
                    {data.creditScore.score.toFixed(1)}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      riskLevelColor[data.creditScore.riskLevel] ??
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {data.creditScore.riskLevel.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Last scored {formatDate(data.creditScore.createdAt)}
                </p>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  Credit Score
                </p>
                <p className="text-sm text-stone-400">Not yet scored</p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 space-y-0.5">
                <p className="text-xs text-stone-400">Applications</p>
                <p className="text-xl font-black text-stone-900">
                  {data.loanApplications.total}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 space-y-0.5">
                <p className="text-xs text-stone-400">Total Loans</p>
                <p className="text-xl font-black text-stone-900">
                  {data.loans.total}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 space-y-0.5">
                <p className="text-xs text-stone-400">Total Repaid</p>
                <p className="text-sm font-black text-stone-900">
                  {fmtRWF(data.repayments.totalAmountRepaid)}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 space-y-0.5">
                <p className="text-xs text-stone-400">Overdue Schedules</p>
                <p
                  className={`text-xl font-black ${
                    data.repaymentSchedules.overdue > 0
                      ? "text-red-600"
                      : "text-stone-900"
                  }`}
                >
                  {data.repaymentSchedules.overdue}
                  <span className="text-xs font-normal text-stone-400 ml-1">
                    / {data.repaymentSchedules.total}
                  </span>
                </p>
              </div>
            </div>

            {/* Loans by status */}
            {Object.keys(data.loans.byStatus).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Loans by Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.loans.byStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-1.5 bg-stone-50 rounded-xl px-3 py-1.5 border border-stone-100"
                    >
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          loanStatusColor[status] ?? "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {status}
                      </span>
                      <span className="text-sm font-semibold text-stone-700">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-1">
    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-black text-stone-900">{value}</p>
    {sub && <p className="text-xs text-stone-400">{sub}</p>}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "regional" | "reports";

export const GovernmentDashboardPage = () => {
  const [tab, setTab] = useState<Tab>("overview");

  const [platform, setPlatform] = useState<PlatformData | null>(null);
  const [regional, setRegional] = useState<RegionalData | null>(null);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);

  const [loadingPlatform, setLoadingPlatform] = useState(false);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  // Fetch platform overview once on mount
  useEffect(() => {
    setLoadingPlatform(true);
    api
      .get("/analytics")
      .then((r) => setPlatform(r.data.data))
      .finally(() => setLoadingPlatform(false));
  }, []);

  // Lazy-load regional data when tab first activated
  useEffect(() => {
    if (tab === "regional" && !regional) {
      setLoadingRegional(true);
      api
        .get("/analytics/regional")
        .then((r) => setRegional(r.data.data))
        .finally(() => setLoadingRegional(false));
    }
  }, [tab, regional]);

  // Lazy-load reports when tab first activated
  useEffect(() => {
    if (tab === "reports" && reports.length === 0) {
      setLoadingReports(true);
      api
        .get("/analytics/reports?limit=50")
        .then((r) => setReports(r.data.data ?? []))
        .finally(() => setLoadingReports(false));
    }
  }, [tab, reports.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "regional", label: "Regional" },
    { id: "reports", label: "Reports" },
  ];

  const downloadCsv = async (endpoint: string, filename: string) => {
    setDownloading(filename);
    try {
      const res = await api.get(endpoint, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // swallow
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Government Dashboard
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Platform-wide analytics and regional data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {loadingPlatform ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
            </div>
          ) : platform ? (
            <>
              {/* Stat grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Farmers"
                  value={platform.farmers.total.toLocaleString()}
                />
                <StatCard
                  label="Total Loans"
                  value={platform.loans.total.toLocaleString()}
                  sub={fmtRWF(platform.loans.totalDisbursedAmount) + " disbursed"}
                />
                <StatCard
                  label="Total Repaid"
                  value={fmtRWF(platform.repayments.totalAmountRepaid)}
                  sub={`${platform.repayments.total.toLocaleString()} repayments`}
                />
                <StatCard
                  label="Avg Credit Score"
                  value={
                    platform.creditScores.averageScore != null
                      ? platform.creditScores.averageScore.toFixed(1)
                      : "—"
                  }
                  sub="out of 100"
                />
                <StatCard
                  label="Active Institutions"
                  value={platform.institutions.activeCount}
                />
                <StatCard
                  label="Active Cooperatives"
                  value={platform.cooperatives.activeCount}
                />
              </div>

              {/* Loans by status */}
              {Object.keys(platform.loans.byStatus).length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                  <h2 className="text-sm font-black text-stone-700 mb-4">
                    Loans by Status
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(platform.loans.byStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-100"
                        >
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              loanStatusColor[status] ??
                              "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {status}
                          </span>
                          <span className="text-sm font-semibold text-stone-900">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Recent loans */}
              {platform.recentLoans.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-50">
                    <h2 className="text-sm font-black text-stone-700">
                      Recent Loans
                    </h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-stone-100">
                      <tr>
                        {["Farmer", "Amount", "Status", "Date"].map((h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-semibold text-stone-400 px-5 py-3"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {platform.recentLoans.map((loan) => (
                        <tr
                          key={loan.id}
                          className="border-b border-stone-50 last:border-0"
                        >
                          <td className="px-5 py-3">
                            <button
                              onClick={() => setSelectedFarmerId(loan.farmer.id)}
                              className="font-medium text-stone-900 hover:text-brand-600 hover:underline transition-colors text-left"
                            >
                              {loan.farmer.user.fullName}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-stone-600">
                            {fmtRWF(loan.principalAmount)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                loanStatusColor[loan.status] ??
                                "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-stone-400">
                            {formatDate(loan.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="text-stone-400 text-sm text-center py-12">
              Failed to load analytics.
            </p>
          )}
        </>
      )}

      {/* ── Regional ─────────────────────────────────────────────────── */}
      {tab === "regional" && (
        <>
          {loadingRegional ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
            </div>
          ) : regional ? (
            <div className="space-y-6">
              {/* Farmers by province */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-50">
                    <h2 className="text-sm font-black text-stone-700">
                      Farmers by Province
                    </h2>
                  </div>
                  {regional.farmersByProvince.length === 0 ? (
                    <p className="text-stone-400 text-sm text-center py-8">
                      No data yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-stone-100">
                        <tr>
                          <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">
                            Province
                          </th>
                          <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                            Farmers
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {regional.farmersByProvince.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-stone-50 last:border-0"
                          >
                            <td className="px-5 py-3 font-medium text-stone-900">
                              {row.province ?? "Unknown"}
                            </td>
                            <td className="px-5 py-3 text-right text-stone-600 font-semibold">
                              {row.farmerCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Credit scores by province */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-50">
                    <h2 className="text-sm font-black text-stone-700">
                      Avg Credit Score by Province
                    </h2>
                  </div>
                  {regional.creditScoresByProvince.length === 0 ? (
                    <p className="text-stone-400 text-sm text-center py-8">
                      No scored farmers yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-stone-100">
                        <tr>
                          <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">
                            Province
                          </th>
                          <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                            Avg Score
                          </th>
                          <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                            Farmers
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {regional.creditScoresByProvince.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-stone-50 last:border-0"
                          >
                            <td className="px-5 py-3 font-medium text-stone-900">
                              {row.province}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-brand-600">
                              {row.averageScore.toFixed(1)}
                            </td>
                            <td className="px-5 py-3 text-right text-stone-400">
                              {row.scoredFarmers}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Farmers by district (top 10) */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-50">
                  <h2 className="text-sm font-black text-stone-700">
                    Farmers by District{" "}
                    <span className="text-stone-400 font-normal">(top 10)</span>
                  </h2>
                </div>
                {regional.farmersByDistrict.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-8">
                    No data yet.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-stone-100">
                      <tr>
                        <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">
                          District
                        </th>
                        <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                          Farmers
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regional.farmersByDistrict.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-stone-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-stone-900">
                            {row.district ?? "Unknown"}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-600 font-semibold">
                            {row.farmerCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Loans by district */}
              {regional.loansByDistrict.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-50">
                    <h2 className="text-sm font-black text-stone-700">
                      Loans by Institution District
                    </h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-stone-100">
                      <tr>
                        <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">
                          District
                        </th>
                        <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                          Loans
                        </th>
                        <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">
                          Applications
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regional.loansByDistrict.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-stone-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-stone-900">
                            {row.district ?? "Unknown"}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-600 font-semibold">
                            {row.loanCount}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-400">
                            {row.applicationCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-12">
              Failed to load regional data.
            </p>
          )}
        </>
      )}

      {/* ── Reports ──────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <>
          {loadingReports ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
              <p className="text-stone-400 font-medium">No reports available yet.</p>
              <p className="text-stone-400 text-sm mt-1">
                Reports are generated by administrators.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                          {reportTypeLabel[report.reportType] ?? report.reportType}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            visibilityColor[report.visibility] ??
                            "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {report.visibility.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="font-semibold text-stone-900 text-sm">
                        {report.title}
                      </p>
                      {report.description && (
                        <p className="text-xs text-stone-500">
                          {report.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-stone-400">
                        {formatDate(report.generatedAt)}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        by {report.generatedBy.fullName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Exports */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-4">Exports</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadCsv("/exports/farmers", "farmers.csv")}
            disabled={downloading !== null}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
          >
            {downloading !== null ? (
              <span className="inline-block w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Farmers CSV
          </button>
        </div>
      </div>

      {/* Farmer drill-down modal */}
      {selectedFarmerId && (
        <FarmerDrillDownModal
          farmerId={selectedFarmerId}
          onClose={() => setSelectedFarmerId(null)}
        />
      )}
    </div>
  );
};
