import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate } from "../utils/format";

interface LoanRef {
  id: string;
  status: string;
  disbursedAt: string | null;
}

interface Application {
  id: string;
  requestedAmount: number;
  approvedAmount: number | null;
  purpose: string;
  purposeDescription: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  loan: LoanRef | null;
  creditScore: { score: number; riskLevel: string } | null;
  farmer?: { user?: { fullName: string; email: string } };
}

type FilterStatus = "ALL" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-brand-100 text-brand-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-stone-100 text-stone-500",
};

const RISK_BADGE: Record<string, string> = {
  LOW: "text-brand-600",
  MEDIUM: "text-yellow-600",
  HIGH: "text-red-500",
};

/* ─── Approve Modal ─── */
interface ApproveModalProps {
  app: Application;
  onClose: () => void;
  onDone: (updated: Application) => void;
}
const ApproveModal = ({ app, onClose, onDone }: ApproveModalProps) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState(String(app.requestedAmount));
  const [rate, setRate] = useState("10");
  const [loading, setLoading] = useState(false);

  const totalPayable = Math.round(Number(amount) * (1 + Number(rate) / 100) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch(`/loan-applications/${app.id}/status`, {
        status: "APPROVED",
        approvedAmount: Number(amount),
        interestRate: Number(rate),
        totalPayable,
      });
      showToast("Application approved.", "success");
      onDone(data.data as Application);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Approval failed.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="font-black text-stone-900 text-lg mb-1">Approve Application</h2>
        <p className="text-stone-400 text-xs mb-4">
          {app.farmer?.user?.fullName} · Requested {formatCurrency(app.requestedAmount)}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Approved amount (RWF)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Interest rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="bg-brand-50 rounded-xl p-3 text-sm">
            <span className="text-stone-500">Total payable: </span>
            <span className="font-bold text-stone-900">{formatCurrency(totalPayable)}</span>
          </div>
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-full text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full text-sm transition-colors">
              {loading ? "Approving…" : "Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Reject Modal ─── */
interface RejectModalProps {
  app: Application;
  onClose: () => void;
  onDone: (updated: Application) => void;
}
const RejectModal = ({ app, onClose, onDone }: RejectModalProps) => {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch(`/loan-applications/${app.id}/status`, {
        status: "REJECTED",
        rejectionReason: reason,
      });
      showToast("Application rejected.", "success");
      onDone(data.data as Application);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Rejection failed.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="font-black text-stone-900 text-lg mb-1">Reject Application</h2>
        <p className="text-stone-400 text-xs mb-4">
          {app.farmer?.user?.fullName} · {formatCurrency(app.requestedAmount)}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Rejection reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Explain why this application is being rejected…"
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-full text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-full text-sm transition-colors">
              {loading ? "Rejecting…" : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Disburse Modal ─── */
interface DisburseModalProps {
  app: Application;
  onClose: () => void;
  onDone: (updated: Application) => void;
}
const DisburseModal = ({ app, onClose, onDone }: DisburseModalProps) => {
  const { showToast } = useToast();
  const loanId = app.loan?.id ?? "";
  const [amount, setAmount] = useState(String(app.approvedAmount ?? app.requestedAmount));
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [months, setMonths] = useState("12");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/loans/${loanId}/disburse`, {
        disbursedAmount: Number(amount),
        startDate,
        durationMonths: Number(months),
      });
      showToast("Loan disbursed successfully.", "success");
      onDone({ ...app, loan: { id: loanId, status: "DISBURSED", disbursedAt: new Date().toISOString() } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Disbursement failed.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="font-black text-stone-900 text-lg mb-1">Disburse Loan</h2>
        <p className="text-stone-400 text-xs mb-4">
          {app.farmer?.user?.fullName} · Approved {formatCurrency(app.approvedAmount ?? app.requestedAmount)}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Disbursed amount (RWF)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Repayment start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Duration (months)</label>
            <div className="flex gap-2">
              {[3, 6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(String(m))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    months === String(m)
                      ? "bg-brand-500 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-full text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full text-sm transition-colors">
              {loading ? "Disbursing…" : "Disburse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
export const FinanceDashboardPage = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [approveTarget, setApproveTarget] = useState<Application | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [disburseTarget, setDisburseTarget] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/loan-applications?limit=50")
      .then((r) => {
        const d = r.data.data;
        setApplications(Array.isArray(d) ? d : (d?.loanApplications ?? []));
      })
      .catch(() => showToast("Failed to load applications.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const updateApp = (updated: Application) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setApproveTarget(null);
    setRejectTarget(null);
    setDisburseTarget(null);
  };

  const startReview = async (app: Application) => {
    setActionLoading(app.id);
    try {
      const { data } = await api.patch(`/loan-applications/${app.id}/status`, { status: "UNDER_REVIEW" });
      updateApp(data.data as Application);
      showToast("Application moved to Under Review.", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Action failed.";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filters: FilterStatus[] = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
  const displayed = filter === "ALL" ? applications : applications.filter((a) => a.status === filter);

  const counts = {
    PENDING: applications.filter((a) => a.status === "PENDING").length,
    UNDER_REVIEW: applications.filter((a) => a.status === "UNDER_REVIEW").length,
    APPROVED: applications.filter((a) => a.status === "APPROVED").length,
    REJECTED: applications.filter((a) => a.status === "REJECTED").length,
  };

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
      showToast("Export failed. Please try again.", "error");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Finance Dashboard</h1>
        <p className="text-stone-500 text-sm mt-0.5">Review and manage loan applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
          <div key={s} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <p className="text-xs text-stone-500 font-medium">{s.replace("_", " ")}</p>
            <p className="text-3xl font-black text-stone-900 mt-1">{counts[s]}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-brand-500 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {f === "ALL" ? "All" : f.replace("_", " ")}
            {f !== "ALL" && (
              <span className={`ml-1.5 ${filter === f ? "opacity-80" : "text-stone-400"}`}>
                {counts[f as keyof typeof counts] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications list */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm">
            No applications {filter !== "ALL" ? `with status ${filter.replace("_", " ")}` : "yet"}.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {displayed.map((app) => {
              const canStartReview = app.status === "PENDING";
              const canDecide = app.status === "UNDER_REVIEW";
              const canDisburse = app.status === "APPROVED" && app.loan?.status === "APPROVED";
              const isDisbursed = app.loan?.disbursedAt != null;

              return (
                <div key={app.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-stone-900">{formatCurrency(app.requestedAmount)}</p>
                        {app.approvedAmount && app.approvedAmount !== app.requestedAmount && (
                          <span className="text-xs text-stone-400">→ approved {formatCurrency(app.approvedAmount)}</span>
                        )}
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[app.status] ?? "bg-stone-100 text-stone-500"}`}>
                          {app.status.replace("_", " ")}
                        </span>
                        {isDisbursed && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">DISBURSED</span>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 mt-1">
                        {app.farmer?.user?.fullName ?? "Farmer"} · {app.purpose}
                        {app.purposeDescription && ` — ${app.purposeDescription}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-xs text-stone-400">{formatDate(app.createdAt)}</p>
                        {app.creditScore && (
                          <p className={`text-xs font-semibold ${RISK_BADGE[app.creditScore.riskLevel] ?? "text-stone-500"}`}>
                            Score {app.creditScore.score} · {app.creditScore.riskLevel} risk
                          </p>
                        )}
                      </div>
                      {app.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {app.rejectionReason}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      {canStartReview && (
                        <button
                          onClick={() => startReview(app)}
                          disabled={actionLoading === app.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                          {actionLoading === app.id ? "…" : "Start Review"}
                        </button>
                      )}
                      {canDecide && (
                        <>
                          <button
                            onClick={() => setApproveTarget(app)}
                            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-full transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(app)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-full transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {canDisburse && (
                        <button
                          onClick={() => setDisburseTarget(app)}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                          Disburse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {approveTarget && (
        <ApproveModal app={approveTarget} onClose={() => setApproveTarget(null)} onDone={updateApp} />
      )}
      {rejectTarget && (
        <RejectModal app={rejectTarget} onClose={() => setRejectTarget(null)} onDone={updateApp} />
      )}
      {disburseTarget && (
        <DisburseModal app={disburseTarget} onClose={() => setDisburseTarget(null)} onDone={updateApp} />
      )}

      {/* Exports */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-4">Exports</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Loans CSV", endpoint: "/exports/loans", file: "loans.csv" },
            { label: "Repayments CSV", endpoint: "/exports/repayments", file: "repayments.csv" },
            { label: "Schedules CSV", endpoint: "/exports/repayment-schedules", file: "repayment-schedules.csv" },
          ].map(({ label, endpoint, file }) => (
            <button
              key={file}
              onClick={() => downloadCsv(endpoint, file)}
              disabled={downloading !== null}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
            >
              {downloading === file ? (
                <span className="inline-block w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
