import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLoanApplications, updateLoanApplicationStatus, type LoanApplicationUi } from "../api/loanApplications";
import { institutionApi, type InstitutionProfile } from "../api/institutions";
import { farmerApi } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const parseMoney = (v?: string | number | null) =>
  typeof v === "number" ? v : Number(String(v ?? "0").replace(/[^0-9.-]/g, "")) || 0;

type DisburseForm = {
  appId: string;
  loanId: string;
  farmerName: string;
  requestedAmount: number;
  disbursedAmount: string;
  startDate: string;
  durationMonths: string;
  interestRate: string;
};

export const FinanceDashboardPage = () => {
  const { showToast } = useToast();
  const [apps, setApps] = useState<LoanApplicationUi[]>([]);
  const [institution, setInstitution] = useState<InstitutionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [disburseForm, setDisburseForm] = useState<DisburseForm | null>(null);
  const [disbursing, setDisbursing] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [loadedApps, inst] = await Promise.all([
          getLoanApplications(),
          institutionApi.getMyInstitution().catch(() => null),
        ]);
        setInstitution(inst);
        // Only show applications sent to THIS institution
        const filtered = inst?.id
          ? loadedApps.filter((a) => a.institutionId === inst.id)
          : loadedApps;
        setApps(filtered);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Unable to load dashboard", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const pending = apps.filter((a) => a.status === "Pending" || a.status === "Under Review").length;
    const approved = apps.filter((a) => a.status === "Approved").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    const totalVolume = apps.reduce((s, a) => s + parseMoney(a.requestedAmount ?? a.amount), 0);
    return { pending, approved, rejected, total: apps.length, totalVolume };
  }, [apps]);

  const handleApprove = async (app: LoanApplicationUi) => {
    try {
      const needsReview = app.status === "Pending";
      if (needsReview) await updateLoanApplicationStatus(app.id, "UNDER_REVIEW");
      const approvedAmount = parseMoney(app.requestedAmount ?? app.amount);
      const updated = await updateLoanApplicationStatus(app.id, "APPROVED", undefined, {
        approvedAmount,
        interestRate: 0,
        totalPayable: approvedAmount,
      });
      setApps((prev) => prev.map((a) => a.id === app.id ? updated : a));
      showToast(`Loan application approved for ${app.farmer}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve application", "error");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      showToast("Please enter a rejection reason before rejecting", "error");
      return;
    }
    try {
      await updateLoanApplicationStatus(id, "REJECTED", rejectReason.trim());
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: "Rejected" } : a));
      setRejectingId(null);
      setRejectReason("");
      showToast("Application rejected", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reject application", "error");
    }
  };

  const openDisburseForm = (app: LoanApplicationUi) => {
    setDisburseForm({
      appId: app.id,
      loanId: app.loanId || app.id,
      farmerName: app.farmer,
      requestedAmount: parseMoney(app.approvedAmount ?? app.requestedAmount ?? app.amount),
      disbursedAmount: String(parseMoney(app.approvedAmount ?? app.requestedAmount ?? app.amount)),
      startDate: new Date().toISOString().split("T")[0],
      durationMonths: "12",
      interestRate: "0",
    });
  };

  const handleDisburse = async () => {
    if (!disburseForm) return;
    const { loanId, disbursedAmount, startDate, durationMonths } = disburseForm;

    if (!disbursedAmount || Number(disbursedAmount) <= 0) {
      showToast("Disbursed amount must be greater than 0", "error");
      return;
    }
    if (!startDate) {
      showToast("Please select a repayment start date", "error");
      return;
    }
    if (!durationMonths || Number(durationMonths) < 1) {
      showToast("Duration must be at least 1 month", "error");
      return;
    }

    setDisbursing(true);
    try {
      await farmerApi.disburseLoan(loanId, {
        disbursedAmount: Number(disbursedAmount),
        startDate: disburseForm.startDate,
        durationMonths: Number(durationMonths),
      });

      const monthly = Math.ceil(Number(disbursedAmount) * (1 + Number(disburseForm.interestRate) / 100) / Number(durationMonths));
      showToast(
        `Loan disbursed! ${durationMonths} monthly installments of RWF ${monthly.toLocaleString()} scheduled for ${disburseForm.farmerName}.`,
        "success"
      );
      setDisburseForm(null);
      setApps((prev) => prev.map((a) => a.id === disburseForm.appId ? { ...a, loanStatus: "ACTIVE", loanDisbursedAt: new Date().toISOString() } : a));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to disburse loan", "error");
    } finally {
      setDisbursing(false);
    }
  };

  const monthly = disburseForm
    ? Math.ceil(
        Number(disburseForm.disbursedAmount) *
          (1 + Number(disburseForm.interestRate) / 100) /
          Math.max(Number(disburseForm.durationMonths), 1)
      )
    : 0;

  if (isLoading) return <div className="p-6 text-sm text-stone-500">Loading finance dashboard...</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">
              {institution?.name || "Financial Institution Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Showing loan applications submitted to your institution.
            </p>
          </div>
          {institution?.status !== "ACTIVE" && (
            <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              Status: {institution?.status || "PENDING"} — waiting for admin approval
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Applications", value: metrics.total, note: "Sent to your institution" },
            { label: "Pending Review", value: metrics.pending, note: "Awaiting your decision" },
            { label: "Approved", value: metrics.approved, note: "Ready to disburse" },
            { label: "Total Volume", value: `RWF ${metrics.totalVolume.toLocaleString()}`, note: "Requested amount" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">{s.value}</p>
              <p className="mt-1 text-xs text-stone-400">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Disburse modal */}
        {disburseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-stone-900">Set Repayment Schedule</h2>
              <p className="mt-1 text-sm text-stone-500">
                Fill in the disbursement details for <strong>{disburseForm.farmerName}</strong>.
                The farmer will see their monthly payment amount and schedule immediately.
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Disbursed Amount (RWF)</span>
                    <input
                      type="number"
                      value={disburseForm.disbursedAmount}
                      onChange={(e) => setDisburseForm((p) => p ? { ...p, disbursedAmount: e.target.value } : p)}
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                    <p className="mt-1 text-xs text-stone-400">Requested: RWF {disburseForm.requestedAmount.toLocaleString()}</p>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Interest Rate (%)</span>
                    <input
                      type="number"
                      value={disburseForm.interestRate}
                      onChange={(e) => setDisburseForm((p) => p ? { ...p, interestRate: e.target.value } : p)}
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Repayment Start Date</span>
                    <input
                      type="date"
                      value={disburseForm.startDate}
                      onChange={(e) => setDisburseForm((p) => p ? { ...p, startDate: e.target.value } : p)}
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Duration (months)</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={disburseForm.durationMonths}
                      onChange={(e) => setDisburseForm((p) => p ? { ...p, durationMonths: e.target.value } : p)}
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Repayment Schedule Preview</p>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-emerald-600">Monthly Payment</p>
                      <p className="text-xl font-bold text-stone-900">RWF {monthly.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600">Duration</p>
                      <p className="text-xl font-bold text-stone-900">{disburseForm.durationMonths} months</p>
                    </div>
                    <div>
                      <p className="text-emerald-600">Total Payable</p>
                      <p className="text-xl font-bold text-stone-900">
                        RWF {(monthly * Number(disburseForm.durationMonths)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-emerald-700">
                    The farmer will see this schedule in their Payments page immediately after disbursement.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setDisburseForm(null)} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Cancel</button>
                <button onClick={() => void handleDisburse()} disabled={disbursing} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
                  {disbursing ? "Disbursing..." : "Disburse & Create Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications table */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Loan Applications</h2>
            <Link to="/finance/applications" className="text-sm text-emerald-600">View all →</Link>
          </div>

          {apps.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">No loan applications have been sent yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {apps.map((app) => (
                <div key={app.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-900">{app.farmer}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          app.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                          app.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                          app.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{app.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-stone-500">
                        RWF {parseMoney(app.requestedAmount ?? app.amount).toLocaleString()} • {app.purpose || app.crop} • Applied {app.date}
                      </div>
                      {app.scoreValue !== "-" && (
                        <div className="mt-1 text-xs text-stone-400">Credit score: {app.scoreValue} ({app.riskLevel || "—"})</div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/finance/applications/${app.id}`} state={{ application: app }} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700">
                        View Details
                      </Link>

                      {(app.status === "Pending" || app.status === "Under Review") && (
                        <>
                          <button onClick={() => void handleApprove(app)} className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                            Approve
                          </button>
                          <button onClick={() => { setRejectingId(app.id); setRejectReason(""); }} className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600">
                            Reject
                          </button>
                        </>
                      )}

                      {app.status === "Approved" && app.loanStatus !== "ACTIVE" && (
                        <button onClick={() => openDisburseForm(app)} className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white">
                          Set Repayment Schedule
                        </button>
                      )}

                      {app.loanStatus === "ACTIVE" && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          Repayment Active
                        </span>
                      )}

                      {rejectingId === app.id && (
                        <div className="mt-2 w-full space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason (required)..."
                            className="w-full rounded-xl border border-rose-200 px-4 py-2 text-sm outline-none focus:border-rose-400"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => void handleReject(app.id)} className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white">
                              Confirm Rejection
                            </button>
                            <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
