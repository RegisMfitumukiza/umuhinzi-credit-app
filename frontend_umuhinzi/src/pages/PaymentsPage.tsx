import { useEffect, useState } from "react";
import { api } from "../api/http";

type Repayment = { id: string; amount: number; paidAt: string; method: string; status: string; transactionRef?: string };
type Schedule = { id: string; dueDate: string; amount: number; status: string; loanId: string };

export const PaymentsPage = () => {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMsg, setPayMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [repRes, schRes] = await Promise.allSettled([
          api.get("/v1/repayments/me"),
          api.get("/v1/repayment-schedules/me"),
        ]);
        if (repRes.status === "fulfilled") setRepayments(repRes.value.data.data ?? []);
        if (schRes.status === "fulfilled") setSchedules(schRes.value.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPaid = repayments.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + r.amount, 0);
  const nextDue = schedules.find((s) => s.status === "PENDING");

  const handlePayNow = async (scheduleId: string) => {
    setPayingId(scheduleId);
    setPayMsg("");
    try {
      await api.post("/v1/repayments", { scheduleId });
      setPayMsg("Payment recorded successfully!");
      const [repRes, schRes] = await Promise.all([api.get("/v1/repayments/me"), api.get("/v1/repayment-schedules/me")]);
      setRepayments(repRes.data.data ?? []);
      setSchedules(schRes.data.data ?? []);
    } catch (err: any) {
      setPayMsg(err?.response?.data?.message ?? "Payment failed.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Repayment Dashboard</h2>
          <p className="mt-2 text-sm text-stone-500">Manage your loan obligations and track payment history.</p>
        </div>
      </section>

      {payMsg && <p className={`rounded-lg px-4 py-2 text-sm ${payMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{payMsg}</p>}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Total Paid</p>
          <h3 className="mt-3 text-3xl font-semibold text-stone-900">{loading ? "—" : `RWF ${totalPaid.toLocaleString()}`}</h3>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Next Due Date</p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-900">{loading ? "—" : nextDue ? new Date(nextDue.dueDate).toLocaleDateString() : "None"}</h3>
          {nextDue && <p className="mt-1 text-xs text-stone-400">RWF {nextDue.amount?.toLocaleString()}</p>}
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Pending Installments</p>
          <h3 className="mt-3 text-3xl font-semibold text-stone-900">{loading ? "—" : schedules.filter((s) => s.status === "PENDING").length}</h3>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
        <div className="space-y-4">
          {/* Upcoming schedule */}
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-xl font-semibold text-stone-900 mb-4">Upcoming Schedule</h3>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : schedules.filter((s) => s.status === "PENDING").length === 0 ? (
              <p className="text-sm text-stone-400">No pending installments.</p>
            ) : (
              <div className="space-y-3">
                {schedules.filter((s) => s.status === "PENDING").slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{new Date(item.dueDate).toLocaleDateString()}</p>
                        <p className="mt-1 text-sm text-stone-600">RWF {item.amount?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handlePayNow(item.id)}
                        disabled={payingId === item.id}
                        className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {payingId === item.id ? "Processing..." : "Pay Now"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Payment history */}
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-xl font-semibold text-stone-900 mb-4">Payment History</h3>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : repayments.length === 0 ? (
              <p className="text-sm text-stone-400">No payment history yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-stone-200">
                <table className="min-w-full divide-y divide-stone-200 text-sm">
                  <thead className="bg-stone-50 text-left text-xs uppercase tracking-[0.2em] text-stone-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Ref</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white text-stone-700">
                    {repayments.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-4">{new Date(row.paidAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4">{row.method ?? "—"}</td>
                        <td className="px-4 py-4">{row.transactionRef ?? "—"}</td>
                        <td className="px-4 py-4 font-semibold text-stone-900">RWF {row.amount?.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <span className={row.status === "SUCCESS" ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-brand-900">Repayment Policy</h3>
            <p className="mt-2 text-sm text-brand-800">Payments are processed within 5-10 minutes. If your balance doesn't update after an hour, contact support with your transaction reference.</p>
          </article>
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Having trouble paying?</h3>
            <p className="mt-2 text-sm text-stone-600">Contact your cooperative manager before the due date to discuss restructuring options.</p>
            <p className="mt-3 text-lg font-semibold text-brand-700">0800 123 456</p>
          </article>
        </div>
      </section>
    </div>
  );
};
