import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmerApi, type FarmerLoan, type FarmerRepayment, type FarmerRepaymentSchedule } from "../api/farmer";
import { useToast } from "../context/ToastContext";

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loans, setLoans] = useState<FarmerLoan[]>([]);
  const [repayments, setRepayments] = useState<FarmerRepayment[]>([]);
  const [schedules, setSchedules] = useState<FarmerRepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ loanId: "", amountPaid: "", paymentMethod: "MOBILE_MONEY", paidAt: "", transactionReference: "" });

  useEffect(() => {
    void (async () => {
      try {
        const [loadedLoans, loadedRepayments, loadedSchedules] = await Promise.all([
          farmerApi.getLoans(),
          farmerApi.getRepayments(),
          farmerApi.getRepaymentSchedules(),
        ]);

        setLoans(loadedLoans);
        setRepayments(loadedRepayments);
        setSchedules(loadedSchedules);
      } catch {
        showToast("Unable to load payment data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const totalDue = useMemo(() => schedules.reduce((sum, schedule) => sum + Number(schedule.amountDue || 0), 0), [schedules]);
  const totalPaid = useMemo(() => repayments.reduce((sum, repayment) => sum + Number(repayment.amountPaid || 0), 0), [repayments]);

  const handleSubmit = async () => {
    if (!form.loanId || !form.amountPaid || !form.paidAt) {
      showToast("Loan, amount paid, and payment date are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      await farmerApi.createRepayment({
        loanId: form.loanId,
        amountPaid: Number(form.amountPaid),
        paymentMethod: form.paymentMethod,
        paidAt: form.paidAt,
        transactionReference: form.transactionReference || undefined,
      });

      const nextRepayments = await farmerApi.getRepayments();
      const nextSchedules = await farmerApi.getRepaymentSchedules();
      setRepayments(nextRepayments);
      setSchedules(nextSchedules);
      setForm({ loanId: "", amountPaid: "", paymentMethod: "MOBILE_MONEY", paidAt: "", transactionReference: "" });
      showToast("Repayment saved successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save repayment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading repayment records...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Repayments</h2>
          <p className="mt-2 text-sm text-stone-500">Record payments and track repayment schedules</p>
        </div>
        <button onClick={() => navigate("/farmer/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">Back to dashboard</button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Loans" value={loans.length} helper="Backend loan list" />
        <StatCard label="Due amount" value={totalDue} helper="From repayment schedules" currency />
        <StatCard label="Paid amount" value={totalPaid} helper="From repayment history" currency />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
          <h3 className="text-xl font-semibold text-stone-900">Record a Payment</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-stone-700">Loan</span>
              <select value={form.loanId} onChange={(e) => setForm((prev) => ({ ...prev, loanId: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="">Select loan</option>
                {loans.map((loan) => <option key={loan.id} value={loan.id}>{loan.id || loan.id} • {loan.status || "UNKNOWN"}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Amount Paid (RWF)</span>
              <input type="number" value={form.amountPaid} onChange={(e) => setForm((prev) => ({ ...prev, amountPaid: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="e.g. 200000" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Payment Method</span>
              <select value={form.paymentMethod} onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Paid At</span>
              <input type="date" value={form.paidAt} onChange={(e) => setForm((prev) => ({ ...prev, paidAt: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-stone-700">Transaction Reference</span>
              <input value={form.transactionReference} onChange={(e) => setForm((prev) => ({ ...prev, transactionReference: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Optional receipt or reference code" />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => navigate("/farmer/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Review Loans</button>
            <button onClick={() => void handleSubmit()} disabled={submitting} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
              {submitting ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Upcoming Schedules</h3>
            <div className="mt-4 space-y-3">
              {schedules.slice(0, 5).map((schedule) => (
                <div key={schedule.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">Installment {schedule.installmentNumber || "-"}</p>
                      <p className="text-sm text-stone-500">{schedule.loan?.purpose || "Loan repayment"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">RWF {Number(schedule.amountDue || 0).toLocaleString()}</p>
                      <p className="text-xs text-stone-500">{schedule.dueDate || "No date"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {schedules.length === 0 && <p className="text-sm text-stone-500">No repayment schedules yet.</p>}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Payment History</h3>
            <div className="mt-4 space-y-3">
              {repayments.slice(0, 5).map((repayment) => (
                <div key={repayment.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">RWF {Number(repayment.amountPaid || 0).toLocaleString()}</p>
                      <p className="text-sm text-stone-500">{repayment.paymentMethod || "Payment"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{repayment.status || "Recorded"}</p>
                      <p className="text-xs text-stone-500">{repayment.paidAt || "No date"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {repayments.length === 0 && <p className="text-sm text-stone-500">No repayments recorded yet.</p>}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, helper, currency = false }: { label: string; value: number; helper: string; currency?: boolean }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="text-sm text-stone-500">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-stone-900">{currency ? `RWF ${Number(value).toLocaleString()}` : value}</div>
    <div className="mt-1 text-xs text-stone-400">{helper}</div>
  </div>
);

export default PaymentsPage;