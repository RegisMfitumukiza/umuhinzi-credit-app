import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate } from "../utils/format";
import type { LoanApplication } from "../types";

const PURPOSES = ["SEEDS", "FERTILIZER", "EQUIPMENT", "IRRIGATION", "LIVESTOCK", "OTHER"];
const TERMS = [3, 6, 12, 18];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    UNDER_REVIEW: "bg-blue-100 text-blue-700",
    APPROVED: "bg-brand-100 text-brand-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-stone-100 text-stone-500",
  };
  return map[status] ?? "bg-stone-100 text-stone-600";
};

export const LoansPage = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [term, setTerm] = useState(12);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/loan-applications")
      .then((r) => setApplications(r.data.data.loanApplications ?? []))
      .catch(() => showToast("Failed to load applications.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.patch(`/loan-applications/${id}/status`, { status: "CANCELLED" });
      setApplications((prev) =>
        prev.map((a): LoanApplication => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
      setConfirmCancel(null);
      showToast("Application cancelled.", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message ?? "Failed to cancel application."
          : "Failed to cancel application.";
      showToast(msg, "error");
    } finally {
      setCancelling(null);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/loan-applications", {
        requestedAmount: Number(amount),
        purpose,
        repaymentTermMonths: term,
      });
      setApplications((prev) => [data.data, ...prev]);
      setAmount("");
      showToast("Application submitted!", "success");
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Failed to submit application.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Loans</h1>
        <p className="text-stone-500 text-sm mt-0.5">Apply for a loan or view your applications</p>
      </div>

      {/* Apply form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-5">Apply for a Loan</h2>
        <form onSubmit={handleApply} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Amount (RWF)</label>
            <input
              type="number"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 500000"
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-stone-700">Repayment term</label>
            <div className="flex gap-2 flex-wrap">
              {TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    term === t
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-stone-600 border-stone-200 hover:border-brand-300"
                  }`}
                >
                  {t} months
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full transition-colors text-sm"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>

      {/* Applications list */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-stone-900 mb-5">My Applications</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : applications.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">No applications yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl border border-stone-100 hover:border-stone-200 transition-colors"
              >
                <div>
                  <p className="font-semibold text-stone-900">{formatCurrency(app.requestedAmount)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{app.purpose} · {formatDate(app.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(app.status)}`}>
                    {app.status.replace(/_/g, " ")}
                  </span>
                  {app.status === "PENDING" && (
                    confirmCancel === app.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-400">Cancel?</span>
                        <button
                          onClick={() => handleCancel(app.id)}
                          disabled={cancelling === app.id}
                          className="text-xs font-bold text-red-600 hover:underline disabled:opacity-60"
                        >
                          {cancelling === app.id ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(null)}
                          className="text-xs font-bold text-stone-400 hover:underline"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancel(app.id)}
                        className="text-xs font-semibold text-stone-400 hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
