import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate } from "../utils/format";
import type { RepaymentSchedule } from "../types";

// Backend returns loanId on schedule entries even though the shared type omits it
interface Schedule extends RepaymentSchedule {
  loanId?: string;
}

const PAYMENT_METHODS = [
  "MOBILE_MONEY",
  "BANK_TRANSFER",
  "CASH",
  "CARD",
  "OTHER",
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PAID: "bg-brand-100 text-brand-700",
    OVERDUE: "bg-red-100 text-red-700",
    PARTIAL: "bg-orange-100 text-orange-700",
  };
  return map[status] ?? "bg-stone-100 text-stone-600";
};

const methodLabel = (m: PaymentMethod) =>
  m
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");

// ─── Make Payment Modal ───────────────────────────────────────────────────────

interface MakePaymentModalProps {
  schedule: Schedule;
  onClose: () => void;
  onPaid: (scheduleId: string) => void;
}

const MakePaymentModal = ({ schedule, onClose, onPaid }: MakePaymentModalProps) => {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [amountPaid, setAmountPaid] = useState(String(schedule.amount));
  const [method, setMethod] = useState<PaymentMethod>("MOBILE_MONEY");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amountPaid);
    if (!parsed || parsed <= 0) {
      showToast("Enter a valid amount.", "error");
      return;
    }
    if (!schedule.loanId) {
      showToast("Loan information not found for this schedule.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/repayments", {
        loanId: schedule.loanId,
        repaymentScheduleId: schedule.id,
        amountPaid: parsed,
        paymentMethod: method,
        ...(transactionRef.trim() ? { transactionReference: transactionRef.trim() } : {}),
      });
      onPaid(schedule.id);
      showToast("Payment recorded!", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message ?? "Failed to record payment."
          : "Failed to record payment.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-base font-black text-stone-900">Make Payment</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Due {formatDate(schedule.dueDate)} · {formatCurrency(schedule.amount)} scheduled
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Amount paid (RWF)
            </label>
            <input
              type="number"
              min="1"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Payment method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {methodLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Transaction ref{" "}
              <span className="text-stone-300 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. MTN-XXXXXXXX"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? "Recording…" : "Record payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PaymentsPage = () => {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<Schedule | null>(null);

  useEffect(() => {
    api
      .get("/repayment-schedules")
      .then((r) => setSchedules(r.data.data.repaymentSchedules ?? []))
      .catch(() => showToast("Failed to load payment schedule.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handlePaid = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((s): Schedule => (s.id === scheduleId ? { ...s, status: "PAID" } : s))
    );
  };

  const pending = schedules.filter(
    (s) => s.status === "PENDING" || s.status === "OVERDUE"
  );
  const paid = schedules.filter(
    (s) => s.status === "PAID" || s.status === "PARTIAL"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Payments</h1>
        <p className="text-stone-500 text-sm mt-0.5">Your repayment schedule</p>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No payments scheduled</p>
          <p className="text-stone-400 text-sm mt-1">
            Your repayment schedule will appear here once a loan is active.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming / overdue */}
          {pending.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-4">Upcoming Payments</h2>
              <div className="flex flex-col gap-3">
                {pending.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      s.status === "OVERDUE"
                        ? "border-red-200 bg-red-50"
                        : "border-stone-100"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(s.amount)}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Due {formatDate(s.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(s.status)}`}
                      >
                        {s.status}
                      </span>
                      {s.loanId && (
                        <button
                          onClick={() => setPaying(s)}
                          className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                          Pay now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid / partial history */}
          {paid.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-4">Payment History</h2>
              <div className="flex flex-col gap-3">
                {paid.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-stone-100 opacity-75"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(s.amount)}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {s.paidAt
                          ? `Paid ${formatDate(s.paidAt)}`
                          : formatDate(s.dueDate)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {paying && (
        <MakePaymentModal
          schedule={paying}
          onClose={() => setPaying(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
};
