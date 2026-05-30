import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getLoanApplications,
  type LoanApplicationUi,
  updateLoanApplicationStatus,
} from "../api/loanApplications";
import { farmerApi, type FarmerLoan } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const exportApplicationsCSV = (apps: LoanApplicationUi[]) => {
  const header = ["id", "farmer", "institution", "purpose", "amount", "score", "date", "status"];
  const rows = apps.map((a) => [a.id, a.farmer, a.institution || "", a.purpose || a.crop, a.amount, a.scoreValue, a.date, a.status]);
  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

const parseMoney = (value?: string | number | null) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
};

const metricsFromData = (apps: LoanApplicationUi[], loans: FarmerLoan[]) => {
  const totalApplications = apps.length;
  const pendingApplications = apps.filter((a) => a.status === "Pending" || a.status === "Under Review").length;
  const approvedApplications = apps.filter((a) => a.status === "Approved").length;
  const uniqueFarmers = new Set(apps.map((a) => a.farmerId || a.farmer)).size;
  const activeLoans = loans.filter((loan) => ["ACTIVE", "DISBURSED", "APPROVED"].includes(String(loan.status || "").toUpperCase()));
  const defaultedLoans = loans.filter((loan) => String(loan.status || "").toUpperCase() === "DEFAULTED").length;
  const completedLoans = loans.filter((loan) => String(loan.status || "").toUpperCase() === "COMPLETED").length;
  const portfolioValue = activeLoans.reduce((sum, loan) => sum + parseMoney(loan.approvedAmount ?? loan.requestedAmount ?? 0), 0);
  const totalLoans = loans.length || 1;
  return {
    totalApplications,
    pendingApplications,
    approvedApplications,
    uniqueFarmers,
    activeLoans: activeLoans.length,
    completedLoans,
    nplRatio: `${((defaultedLoans / totalLoans) * 100).toFixed(1)}%`,
    recoveryRate: `${((completedLoans / totalLoans) * 100).toFixed(1)}%`,
    portfolioValue: `RWF ${portfolioValue.toLocaleString()}`,
  };
};

export const FinanceDashboardPage = () => {
  const [apps, setApps] = useState<LoanApplicationUi[]>([]);
  const [loans, setLoans] = useState<FarmerLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    void (async () => {
      try {
        const [loadedApplications, loadedLoans] = await Promise.all([
          getLoanApplications(),
          farmerApi.getLoans().catch(() => [] as FarmerLoan[]),
        ]);
        setApps(loadedApplications);
        setLoans(loadedLoans);
      } catch {
        showToast("Unable to load applications", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => metricsFromData(apps, loans), [apps, loans]);

  const applicationBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    apps.forEach((app) => {
      const key = app.purpose || app.crop || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [apps]);

  const recentActivity = useMemo(() => apps.slice(0, 4), [apps]);

  async function handleUpdateStatus(id: string, status: "APPROVED" | "REJECTED") {
    try {
      const updated = await updateLoanApplicationStatus(id, status);
      setApps((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Application ${status.toLowerCase()} successfully`, "success");
    } catch {
      showToast("Unable to update application status", "error");
    }
  }

  function handleExportCSV() {
    const csv = exportApplicationsCSV(apps);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-stone-500">Loading finance dashboard...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Financial Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">Welcome back. Here is the overview of the loan portfolio for Q3 2024.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Export CSV</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">New Review Process</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Active Portfolio</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.portfolioValue}</div>
            <div className="mt-1 text-xs text-stone-400">From active loans</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Farmers in Pipeline</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.uniqueFarmers}</div>
            <div className="mt-1 text-xs text-stone-400">Unique farmers with applications</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">NPL Ratio</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.nplRatio}</div>
            <div className="mt-1 text-xs text-stone-400">Based on loan status</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Loan Recovery</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.recoveryRate}</div>
            <div className="mt-1 text-xs text-stone-400">Completed loans / all loans</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Financial Performance</h2>
              <div className="text-sm text-stone-500">Live</div>
            </div>
            <div className="space-y-3 rounded-lg border border-stone-100 bg-stone-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Pending review</span>
                <span className="font-semibold text-stone-900">{metrics.pendingApplications}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Approved applications</span>
                <span className="font-semibold text-stone-900">{metrics.approvedApplications}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Active loans</span>
                <span className="font-semibold text-stone-900">{metrics.activeLoans}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, (metrics.approvedApplications / Math.max(metrics.totalApplications, 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Portfolio by Purpose</div>
              <div className="mt-3 space-y-3 text-sm">
                {applicationBreakdown.length > 0 ? applicationBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <span className="text-stone-700">{item.label}</span>
                    <span className="font-semibold text-stone-900">{item.count}</span>
                  </div>
                )) : <div className="text-stone-500">No applications yet.</div>}
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Application Status Mix</div>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div className="flex items-center justify-between"><span>Awaiting review</span><span>{metrics.pendingApplications}</span></div>
                <div className="flex items-center justify-between"><span>Approved</span><span>{metrics.approvedApplications}</span></div>
                <div className="flex items-center justify-between"><span>Rejected</span><span>{apps.filter((a) => a.status === "Rejected").length}</span></div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.45fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Recent Applications</h3>
              <Link className="text-sm text-emerald-600" to="/finance/applications">View All</Link>
            </div>

            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 border-b border-stone-100 py-3">
                  <div>
                    <div className="font-semibold text-stone-900">{a.farmer}</div>
                    <div className="text-xs text-stone-500">
                      {a.amount} • {a.purpose || a.crop} • {a.institution || "Assigned institution"}
                    </div>
                    {a.purposeDescription && <div className="mt-1 text-xs text-stone-400">{a.purposeDescription}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-stone-500">{a.status}</div>
                    {a.status !== "Approved" && a.status !== "Rejected" && a.status !== "Cancelled" && (
                      <>
                        <button onClick={() => void handleUpdateStatus(a.id, "APPROVED")} className="rounded-full border border-stone-200 px-3 py-1 text-sm text-emerald-700">Approve</button>
                        <button onClick={() => void handleUpdateStatus(a.id, "REJECTED")} className="rounded-full border border-stone-200 px-3 py-1 text-sm text-rose-700">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && <div className="py-4 text-sm text-stone-500">No loan applications found in the database.</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-stone-500">Notifications</div>
            <div className="mt-3 space-y-2 text-sm text-stone-600">
              <div>{metrics.pendingApplications} applications awaiting review</div>
              <div>{metrics.approvedApplications} applications approved from farmer submissions</div>
              <div>{metrics.completedLoans} completed loans in the active portfolio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
