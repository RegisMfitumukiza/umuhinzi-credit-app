import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http";

type LoanApp = {
  id: string; amount: number; purpose: string; status: string;
  repaymentPeriodMonths: number; createdAt: string; reviewedAt?: string;
  reviewNotes?: string; farmer?: { fullName: string; email: string };
};

export const LoanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<LoanApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/v1/loan-applications/${id}`)
      .then((res) => setLoan(res.data.data))
      .catch(() => setError("Loan application not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-stone-500">Loading...</p>;
  if (error || !loan) return <p className="p-6 text-sm text-red-500">{error || "Not found."}</p>;

  const statusColor = loan.status === "APPROVED" ? "bg-green-50 text-green-700" :
    loan.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Loans › Details</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">Loan Application</h2>
        </div>
        <button onClick={() => navigate("/loans")} className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50">← Back</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Amount", `RWF ${loan.amount?.toLocaleString()}`],
          ["Purpose", loan.purpose],
          ["Repayment Period", `${loan.repaymentPeriodMonths} Months`],
          ["Status", loan.status],
          ["Applied On", new Date(loan.createdAt).toLocaleDateString()],
          ["Reviewed On", loan.reviewedAt ? new Date(loan.reviewedAt).toLocaleDateString() : "Pending"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{label}</p>
            {label === "Status"
              ? <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}>{value}</span>
              : <p className="mt-2 text-lg font-semibold text-stone-900">{value}</p>}
          </article>
        ))}
      </div>

      {loan.reviewNotes && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold text-stone-700">Review Notes</p>
          <p className="mt-2 text-sm text-stone-600">{loan.reviewNotes}</p>
        </div>
      )}
    </div>
  );
};
