import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
type LoanStatus = "APPROVED" | "DISBURSED" | "ACTIVE" | "COMPLETED" | "DEFAULTED" | "CANCELLED";

interface LoanApplication {
  id: string;
  requestedAmount: number;
  approvedAmount: number | null;
  interestRate: number | null;
  purpose: string;
  purposeDescription: string | null;
  status: AppStatus;
  rejectionReason: string | null;
  createdAt: string;
  farmer: { id: string; user: { fullName: string; email: string } } | null;
  institution: { id: string; name: string } | null;
}

interface Loan {
  id: string;
  principalAmount: number;
  disbursedAmount: number | null;
  interestRate: number;
  totalPayable: number;
  disbursedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  status: LoanStatus;
  createdAt: string;
  farmer: { id: string; user: { fullName: string; email: string } } | null;
  institution: { id: string; name: string } | null;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const appStatusBadge = (s: AppStatus) => {
  const map: Record<AppStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    UNDER_REVIEW: "bg-blue-100 text-blue-700",
    APPROVED: "bg-brand-100 text-brand-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-stone-100 text-stone-500",
  };
  return map[s] ?? "bg-stone-100 text-stone-600";
};

const loanStatusBadge = (s: LoanStatus) => {
  const map: Record<LoanStatus, string> = {
    APPROVED: "bg-yellow-100 text-yellow-700",
    DISBURSED: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-brand-100 text-brand-700",
    COMPLETED: "bg-teal-100 text-teal-700",
    DEFAULTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-stone-100 text-stone-500",
  };
  return map[s] ?? "bg-stone-100 text-stone-600";
};

// ─── Review Application Modal ─────────────────────────────────────────────────

interface ReviewModalProps {
  application: LoanApplication;
  onClose: () => void;
  onUpdated: (updated: LoanApplication) => void;
}

const ReviewApplicationModal = ({ application, onClose, onUpdated }: ReviewModalProps) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<AppStatus>(application.status);
  const [approvedAmount, setApprovedAmount] = useState(
    application.approvedAmount?.toString() ?? application.requestedAmount.toString()
  );
  const [interestRate, setInterestRate] = useState(
    application.interestRate?.toString() ?? ""
  );
  const [rejectionReason, setRejectionReason] = useState(
    application.rejectionReason ?? ""
  );
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (status === application.status) { onClose(); return; }
    setSaving(true);
    const body: Record<string, unknown> = { status };
    if (status === "APPROVED") {
      const amt = parseFloat(approvedAmount);
      if (!isNaN(amt) && amt > 0) body.approvedAmount = amt;
      const rate = parseFloat(interestRate);
      if (!isNaN(rate) && rate > 0) body.interestRate = rate;
    }
    if (status === "REJECTED" && rejectionReason.trim()) {
      body.rejectionReason = rejectionReason.trim();
    }
    try {
      const r = await api.patch(`/loan-applications/${application.id}/status`, body);
      onUpdated(r.data.data as LoanApplication);
      showToast("Application status updated.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Failed to update."
          : "Failed to update.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-black text-stone-900">Review application</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {application.farmer?.user.fullName ?? "Unknown"} — {application.purpose}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 font-medium">Requested</p>
            <p className="font-semibold text-stone-800 mt-0.5">
              {application.requestedAmount.toLocaleString()} RWF
            </p>
          </div>
          {application.institution && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Institution</p>
              <p className="font-medium text-stone-700 mt-0.5">{application.institution.name}</p>
            </div>
          )}
          {application.farmer?.user.email && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Farmer email</p>
              <p className="text-stone-700 mt-0.5">{application.farmer.user.email}</p>
            </div>
          )}
          {application.purposeDescription && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 font-medium">Description</p>
              <p className="text-stone-700 mt-0.5">{application.purposeDescription}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-400 font-medium">Submitted</p>
            <p className="text-stone-600 mt-0.5">{formatDate(application.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Current status</p>
            <span
              className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${appStatusBadge(application.status)}`}
            >
              {application.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Update status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppStatus)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          >
            {(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"] as AppStatus[]).map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              )
            )}
          </select>
        </div>

        {status === "APPROVED" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Approved amount (RWF)
              </label>
              <input
                type="number"
                min="0"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Interest rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 12"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Rejection reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Explain why the application was rejected"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Manage Loan Modal ────────────────────────────────────────────────────────

interface ManageLoanModalProps {
  loan: Loan;
  onClose: () => void;
  onUpdated: (updated: Loan) => void;
}

const ManageLoanModal = ({ loan, onClose, onUpdated }: ManageLoanModalProps) => {
  const { showToast } = useToast();
  const [disbursedAmount, setDisbursedAmount] = useState(loan.principalAmount.toString());
  const [startDate, setStartDate] = useState("");
  const [durationMonths, setDurationMonths] = useState("12");
  const [disbursing, setDisbursing] = useState(false);
  const [newStatus, setNewStatus] = useState<LoanStatus>(loan.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleDisburse = async () => {
    const amt = parseFloat(disbursedAmount);
    const dur = parseInt(durationMonths, 10);
    if (!startDate || isNaN(amt) || amt <= 0 || isNaN(dur) || dur < 1) {
      showToast("Please fill in all required disburse fields.", "error");
      return;
    }
    setDisbursing(true);
    try {
      const r = await api.patch(`/loans/${loan.id}/disburse`, {
        disbursedAmount: amt,
        startDate,
        durationMonths: dur,
      });
      onUpdated(r.data.data as Loan);
      showToast("Loan disbursed successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Failed to disburse."
          : "Failed to disburse.";
      showToast(msg, "error");
    } finally {
      setDisbursing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === loan.status) { onClose(); return; }
    setStatusSaving(true);
    try {
      const r = await api.patch(`/loans/${loan.id}/status`, { status: newStatus });
      onUpdated(r.data.data as Loan);
      showToast("Loan status updated.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Failed to update."
          : "Failed to update.";
      showToast(msg, "error");
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-base font-black text-stone-900">Manage loan</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {loan.farmer?.user.fullName ?? "Unknown"}
            {loan.institution ? ` — ${loan.institution.name}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 font-medium">Principal</p>
            <p className="font-semibold text-stone-800 mt-0.5">
              {loan.principalAmount.toLocaleString()} RWF
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Interest rate</p>
            <p className="font-semibold text-stone-800 mt-0.5">{loan.interestRate}%</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Total payable</p>
            <p className="font-medium text-stone-700 mt-0.5">
              {loan.totalPayable.toLocaleString()} RWF
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Status</p>
            <span
              className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${loanStatusBadge(loan.status)}`}
            >
              {loan.status}
            </span>
          </div>
          {loan.startDate && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Start date</p>
              <p className="text-stone-600 mt-0.5">{formatDate(loan.startDate)}</p>
            </div>
          )}
          {loan.endDate && (
            <div>
              <p className="text-xs text-stone-400 font-medium">End date</p>
              <p className="text-stone-600 mt-0.5">{formatDate(loan.endDate)}</p>
            </div>
          )}
          {loan.disbursedAt && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Disbursed</p>
              <p className="text-stone-600 mt-0.5">{formatDate(loan.disbursedAt)}</p>
            </div>
          )}
        </div>

        {loan.status === "APPROVED" && (
          <div className="space-y-3 border border-stone-100 rounded-xl p-4">
            <p className="text-sm font-bold text-stone-800">Disburse loan</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Disbursed amount (RWF) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={disbursedAmount}
                onChange={(e) => setDisbursedAmount(e.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Start date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Duration (months) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleDisburse}
              disabled={disbursing}
              className="w-full py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {disbursing ? "Disbursing…" : "Disburse loan"}
            </button>
          </div>
        )}

        <div className="space-y-3 border border-stone-100 rounded-xl p-4">
          <p className="text-sm font-bold text-stone-800">Update status</p>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as LoanStatus)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          >
            {(
              ["APPROVED", "DISBURSED", "ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"] as LoanStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={statusSaving}
              className="flex-1 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {statusSaving ? "Saving…" : "Update status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Applications Tab ─────────────────────────────────────────────────────────

const APP_STATUSES: AppStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const ApplicationsTab = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewing, setReviewing] = useState<LoanApplication | null>(null);

  useEffect(() => {
    api
      .get("/loan-applications?limit=100")
      .then((r) => setApplications((r.data.data as LoanApplication[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter(
    (a) => !statusFilter || a.status === statusFilter
  );

  const handleUpdated = (updated: LoanApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All statuses</option>
          {APP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <span className="text-xs text-stone-400">
          {filtered.length} application{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">
            No loan applications found.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Farmer", "Institution", "Requested", "Purpose", "Status", "Date", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left text-xs font-semibold text-stone-400 px-4 py-3"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">
                      {a.farmer?.user.fullName ?? "—"}
                    </p>
                    {a.farmer?.user.email && (
                      <p className="text-xs text-stone-400">{a.farmer.user.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{a.institution?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {a.requestedAmount.toLocaleString()} RWF
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{a.purpose}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${appStatusBadge(a.status)}`}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setReviewing(a)}
                      className="text-xs font-semibold text-stone-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-full border border-stone-200 hover:border-brand-200 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reviewing && (
        <ReviewApplicationModal
          application={reviewing}
          onClose={() => setReviewing(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
};

// ─── Loans Tab ────────────────────────────────────────────────────────────────

const LOAN_STATUSES: LoanStatus[] = [
  "APPROVED",
  "DISBURSED",
  "ACTIVE",
  "COMPLETED",
  "DEFAULTED",
  "CANCELLED",
];

const LoansTab = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [managing, setManaging] = useState<Loan | null>(null);

  useEffect(() => {
    api
      .get("/loans?limit=100")
      .then((r) => setLoans((r.data.data as Loan[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = loans.filter(
    (l) => !statusFilter || l.status === statusFilter
  );

  const handleUpdated = (updated: Loan) => {
    setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All statuses</option>
          {LOAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-stone-400">
          {filtered.length} loan{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No loans found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                {["Farmer", "Institution", "Principal", "Rate", "Status", "Disbursed", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left text-xs font-semibold text-stone-400 px-4 py-3"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">
                      {l.farmer?.user.fullName ?? "—"}
                    </p>
                    {l.farmer?.user.email && (
                      <p className="text-xs text-stone-400">{l.farmer.user.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{l.institution?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {l.principalAmount.toLocaleString()} RWF
                  </td>
                  <td className="px-4 py-3 text-stone-500">{l.interestRate}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${loanStatusBadge(l.status)}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {l.disbursedAt ? formatDate(l.disbursedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManaging(l)}
                      className="text-xs font-semibold text-stone-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-full border border-stone-200 hover:border-brand-200 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {managing && (
        <ManageLoanModal
          loan={managing}
          onClose={() => setManaging(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "applications" | "loans";

export const AdminLoansPage = () => {
  const [tab, setTab] = useState<Tab>("applications");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Loan Management</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Review applications and manage active loans
        </p>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-2xl p-1 w-fit">
        {(
          [
            ["applications", "Applications"],
            ["loans", "Loans"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === value
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "applications" ? <ApplicationsTab /> : <LoansTab />}
    </div>
  );
};
