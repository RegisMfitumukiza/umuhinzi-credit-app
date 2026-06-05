import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { cooperativeMembersApi } from "../api/cooperativeMembers";
import { getCurrentUserProfile } from "../api/users";
import {
  getLoanApplications,
  type LoanApplicationUi,
  updateLoanApplicationStatus,
} from "../api/loanApplications";
import { institutionApi } from "../api/institutions";
import { useToast } from "../context/ToastContext";

const statusStyles: Record<string, string> = {
  Pending: "bg-stone-100 text-stone-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  Cancelled: "bg-stone-200 text-stone-700",
};

const cropStyles: Record<string, string> = {
  "Irish Potato": "bg-emerald-100 text-emerald-700",
  Coffee: "bg-emerald-100 text-emerald-700",
  Maize: "bg-emerald-100 text-emerald-700",
  Beans: "bg-emerald-100 text-emerald-700",
  Wheat: "bg-emerald-100 text-emerald-700",
};

const parseAmount = (value: string) => Number(value.replace(/,/g, "")) || 0;

const getStats = (apps: LoanApplicationUi[]) => {
  const totalRequests = apps.length;
  const pendingReview = apps.filter((application) => application.status === "Pending" || application.status === "Under Review").length;
  const approvedThisList = apps.filter((application) => application.status === "Approved").length;
  const scores = apps
    .map((application) => Number(application.scoreValue))
    .filter((score) => Number.isFinite(score) && score > 0);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

  return [
    { label: "Total Requests", value: String(totalRequests), tone: `${totalRequests} total` },
    { label: "Pending Review", value: String(pendingReview), tone: pendingReview > 0 ? `${pendingReview} Urgent` : "No pending" },
    { label: "Approved (MTD)", value: String(approvedThisList), tone: `${approvedThisList} approved` },
    { label: "Avg. Credit Score", value: averageScore ? String(averageScore) : "N/A", tone: averageScore ? "Live data" : "No score yet" },
  ];
};

type CooperativeApplicationsPageProps = {
  showActions?: boolean;
  title?: string;
  subtitle?: string;
  emptyStateMessage?: string;
  scope?: "cooperative" | "institution";
};

export const CooperativeApplicationsPage = ({
  showActions = false,
  title = "Loan Applications",
  subtitle = "Manage and review agricultural loan requests from cooperatives across Rwanda.",
  emptyStateMessage = "No applications submitted yet.",
  scope = "cooperative",
}: CooperativeApplicationsPageProps) => {
  const [appsState, setAppsState] = useState<LoanApplicationUi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const stats = getStats(appsState);

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);

        if (scope === "institution") {
          const institutionId =
            currentUser?.institutionProfile?.id ||
            (await institutionApi.getMyInstitution().catch(() => null))?.id;
          if (!institutionId) {
            setAppsState([]);
            return;
          }

          const data = await getLoanApplications(institutionId).catch(() => [] as LoanApplicationUi[]);
          setAppsState(data.filter((application) => application.institutionId === institutionId));
          return;
        }

        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;
        if (!cooperativeId) {
          setAppsState([]);
          return;
        }

        const [memberRows, data] = await Promise.all([
          cooperativeMembersApi.getMyCooperativeMembers().catch(() => []),
          getLoanApplications().catch(() => [] as LoanApplicationUi[]),
        ]);

        const farmerIds = new Set(memberRows.map((member) => member.farmerId));
        setAppsState(data.filter((application) => application.farmerId ? farmerIds.has(application.farmerId) : false));
      } catch {
        setAppsState([]);
        showToast("Unable to load cooperative applications", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [scope, showToast]);

  async function handleUpdate(application: LoanApplicationUi, status: "APPROVED" | "REJECTED") {
    try {
      const needsReviewStep = application.status === "Pending" || application.status === "PENDING";
      let rejectionReason: string | undefined;
      let terms: Parameters<typeof updateLoanApplicationStatus>[3];

      if (status === "REJECTED") {
        rejectionReason = window.prompt("Enter rejection reason")?.trim() || undefined;
        if (!rejectionReason) {
          showToast("Rejection reason is required", "error");
          return;
        }
      } else {
        const approvedAmount = application.requestedAmount ?? parseAmount(application.amount);
        terms = {
          approvedAmount,
          interestRate: 0,
          totalPayable: approvedAmount,
        };
      }

      const updated = needsReviewStep
        ? await updateLoanApplicationStatus(application.id, "UNDER_REVIEW").then(() =>
            updateLoanApplicationStatus(application.id, status, rejectionReason, terms)
          )
        : await updateLoanApplicationStatus(application.id, status, rejectionReason, terms);
      setAppsState((p) => p.map((x) => (x.id === application.id ? updated : x)));
      showToast(`Application ${status.toLowerCase()} successfully`, "success");
    } catch {
      showToast("Unable to update application status", "error");
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-stone-500">Loading applications...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">{title}</h1>
            <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { const csv = window.confirm("Export CSV?"); if (csv) { const blob = new Blob([JSON.stringify(appsState)], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "applications.json"; a.click(); URL.revokeObjectURL(url); } }} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Export Data</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">New Application</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-50 text-stone-700">+</div>
                <span className="rounded-full border border-stone-200 px-2 py-1 text-[11px] text-stone-500">{stat.tone}</span>
              </div>
              <div className="text-sm text-stone-500">{stat.label}</div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <input
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
                placeholder="Search by ID, name, or cooperative..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">All Statuses</button>
              <button className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">All Crops</button>
              <button className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">All Regions</button>
              <button className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">⇩</button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.15em] text-stone-400">
                  <th className="px-3 py-2"><input type="checkbox" /></th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Farmer Details</th>
                  <th className="px-3 py-2">Crop</th>
                  <th className="px-3 py-2">Amount (RWF)</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Submission Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appsState.map((application, index) => (
                  <tr key={application.id} className={`rounded-2xl border ${index === appsState.length - 1 ? "border-violet-300 ring-1 ring-violet-200" : "border-stone-200"} bg-white shadow-sm`}>
                    <td className="px-3 py-5"><input type="checkbox" /></td>
                    <td className="px-3 py-5 font-medium text-stone-500">
                      <div>{application.id.split("-")[0]}.</div>
                      <div>{application.id.split("-")[1]}</div>
                    </td>
                    <td className="px-3 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
                          {application.farmer.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{application.farmer}</div>
                          <div className="text-xs text-stone-500">{application.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-5">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cropStyles[application.crop]}`}>{application.crop}</span>
                    </td>
                    <td className="px-3 py-5">
                      <div className="font-semibold text-stone-900">{application.amount}</div>
                      <div className="text-xs text-stone-500">RWF</div>
                    </td>
                    <td className="px-3 py-5">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">{application.scoreLabel}</div>
                      <div className="mt-1 text-xs text-stone-500">{application.scoreValue}</div>
                    </td>
                    <td className="px-3 py-5 text-stone-600">{application.date}</td>
                    <td className="px-3 py-5">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>{application.status}</span>
                    </td>
                    <td className="px-3 py-5 text-right">
                      {showActions ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Link to={`/finance/applications/${application.id}`} state={{ application }}>
                            <button className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700">View</button>
                          </Link>
                          {application.status !== "Approved" && application.status !== "Rejected" && application.status !== "Cancelled" && (
                            <>
                              <button onClick={() => void handleUpdate(application, "APPROVED")} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-emerald-700">Approve</button>
                              <button onClick={() => void handleUpdate(application, "REJECTED")} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-rose-700">Reject</button>
                            </>
                          )}
                        </div>
                      ) : (
                        <Link to={`/cooperatives/applications/${application.id}`}>
                          <button className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700">Review</button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {appsState.length === 0 && <div className="mt-4 text-sm text-stone-500">{emptyStateMessage}</div>}

          <div className="mt-4 flex flex-col gap-3 border-t border-stone-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-stone-500">Showing 1-5 of {appsState.length} applications</p>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span>Rows per page:</span>
              <button className="rounded-lg border border-stone-200 px-3 py-2">10</button>
              <div className="flex items-center gap-1">
                <button className="rounded-lg border border-stone-200 px-3 py-2">‹</button>
                <button className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-white">1</button>
                <button className="rounded-lg border border-stone-200 px-3 py-2">2</button>
                <button className="rounded-lg border border-stone-200 px-3 py-2">3</button>
                <span className="px-2">...</span>
                <button className="rounded-lg border border-stone-200 px-3 py-2">12</button>
                <button className="rounded-lg border border-stone-200 px-3 py-2">›</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-semibold text-emerald-900">Automated Risk Scoring Engine is active</div>
              <p className="mt-1 max-w-3xl text-sm text-emerald-900/70">
                Scores are calculated based on historical harvest yields, satellite weather data, and repayment behavior from previous micro-loans.
                High-risk profiles (Score D) are flagged automatically for manual onsite verification.
              </p>
            </div>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">View Methodology →</button>
          </div>
        </div>
      </div>
    </div>
  );
};
