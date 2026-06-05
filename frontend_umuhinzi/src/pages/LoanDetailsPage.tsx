import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

type LoanDetail = {
  id: string;
  status?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  interestRate?: number;
  totalPayable?: number;
  purpose?: string;
  purposeDescription?: string;
  startDate?: string;
  durationMonths?: number;
  createdAt?: string;
  institution?: { name?: string; type?: string };
  repaymentSchedules?: Array<{
    id: string;
    installmentNumber?: number;
    dueDate?: string;
    amountDue?: number;
    status?: string;
  }>;
};

const fmt = (v?: number) => `RWF ${Number(v || 0).toLocaleString()}`;
const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString() : "-");

const statusColor = (s?: string) => {
  const u = (s || "").toUpperCase();
  if (u === "ACTIVE" || u === "DISBURSED") return "bg-emerald-100 text-emerald-700";
  if (u === "APPROVED") return "bg-blue-100 text-blue-700";
  if (u === "COMPLETED") return "bg-stone-100 text-stone-600";
  if (u === "DEFAULTED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

export const LoanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const res = await api.get<{ data: LoanDetail }>(`/loans/${id}`);
        setLoan(res.data.data);
      } catch {
        showToast("Unable to load loan details", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, showToast]);

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading loan details...</div>;
  if (!loan) return <div className="p-6 text-sm text-stone-500">Loan not found.</div>;

  const schedules = loan.repaymentSchedules ?? [];
  const paidCount = schedules.filter((s) => (s.status || "").toUpperCase() === "PAID").length;
  const overdueCount = schedules.filter((s) => (s.status || "").toUpperCase() === "OVERDUE").length;
  const progressPct = schedules.length > 0 ? Math.round((paidCount / schedules.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mb-2 text-sm text-stone-500">← Back</button>
          <h2 className="text-2xl font-semibold text-stone-900">Loan Details</h2>
          <p className="mt-1 text-sm text-stone-500">Full loan record</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(loan.status)}`}>
          {loan.status || "UNKNOWN"}
        </span>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Requested Amount", value: fmt(loan.requestedAmount) },
          { label: "Approved Amount", value: fmt(loan.approvedAmount) },
          { label: "Disbursed Amount", value: fmt(loan.disbursedAmount) },
          { label: "Total Payable", value: fmt(loan.totalPayable) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{c.label}</p>
            <p className="mt-2 text-xl font-semibold text-stone-900">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Loan Information</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: "Purpose", value: loan.purpose || "-" },
              { label: "Institution", value: loan.institution?.name || "-" },
              { label: "Interest Rate", value: loan.interestRate != null ? `${loan.interestRate}%` : "-" },
              { label: "Duration", value: loan.durationMonths != null ? `${loan.durationMonths} months` : "-" },
              { label: "Start Date", value: fmtDate(loan.startDate) },
              { label: "Applied On", value: fmtDate(loan.createdAt) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-stone-100 p-4">
                <p className="text-xs text-stone-500">{item.label}</p>
                <p className="mt-1 font-semibold text-stone-900">{item.value}</p>
              </div>
            ))}
          </div>
          {loan.purposeDescription && (
            <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs font-semibold text-stone-500">Purpose Description</p>
              <p className="mt-1 text-sm text-stone-700">{loan.purposeDescription}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900">Repayment Progress</h3>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>{paidCount} of {schedules.length} paid</span>
                <span className="font-semibold">{progressPct}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-stone-500">
                <span className="text-emerald-600">{paidCount} paid</span>
                <span className="text-amber-600">{schedules.length - paidCount - overdueCount} upcoming</span>
                {overdueCount > 0 && <span className="text-rose-600">{overdueCount} overdue</span>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Quick Actions</h3>
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={() => navigate("/payments")} className="w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Make a Payment</button>
              <button onClick={() => navigate("/loans")} className="w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">View All Loans</button>
            </div>
          </div>
        </div>
      </section>

      {schedules.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-stone-900">Repayment Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left">
                  <th className="px-4 py-3 font-semibold text-stone-600">#</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Amount Due</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-stone-50">
                    <td className="px-4 py-3 text-stone-600">{s.installmentNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-stone-600">{fmtDate(s.dueDate)}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{fmt(s.amountDue)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(s.status)}`}>
                        {s.status || "SCHEDULED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
