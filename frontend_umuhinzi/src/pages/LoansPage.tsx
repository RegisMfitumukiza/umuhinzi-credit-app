import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

const termOptions = ["3", "6", "12", "18"];

type LoanApplication = { id: string; requestedAmount: number; purpose: string; status: string; createdAt: string };
type CreditScore = { score: number; tier: string; maxLoanAmount: number };

export const LoansPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [term, setTerm] = useState("6");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, scoreRes] = await Promise.allSettled([
          api.get("/v1/loan-applications"),
          api.get("/v1/credit-scores/latest"),
        ]);
        if (appsRes.status === "fulfilled") setApplications(appsRes.value.data.data ?? []);
        if (scoreRes.status === "fulfilled") setCreditScore(scoreRes.value.data.data ?? null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!amount || !purpose) { setError("Amount and purpose are required."); return; }
    setSubmitting(true);
    try {
      await api.post("/v1/loan-applications", {
        requestedAmount: Number(amount),
        purpose,
      });
      setSuccess("Loan application submitted successfully!");
      setAmount("");
      setPurpose("");
      setTerm("6");
      const res = await api.get("/v1/loan-applications");
      setApplications(res.data.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Loan Application</h2>
          <p className="mt-2 text-sm text-stone-500">Fill out the details below to secure your agricultural funding.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold">1</div>
              <div>
                <h3 className="text-xl font-semibold text-stone-900">Loan Details</h3>
                <p className="text-sm text-stone-500">Define how much you need and what it's for.</p>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
            {success && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</p>}

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Requested Amount (RWF)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                placeholder="e.g. 800000"
              />
              {creditScore && <span className="mt-2 block text-xs text-stone-400">Max eligible: RWF {creditScore.maxLoanAmount?.toLocaleString()}</span>}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Loan Purpose</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="">Select purpose...</option>
                {["SEEDS","FERTILIZER","EQUIPMENT","IRRIGATION","LIVESTOCK","LAND_RENT","LABOR","TRANSPORT","STORAGE","OTHER"].map((p) => (
                  <option key={p} value={p}>{p.replace("_", " ")}</option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-sm font-medium text-stone-700">Repayment Period (Months)</span>
              <div className="mt-3 grid gap-3 grid-cols-4">
                {termOptions.map((t) => (
                  <button key={t} type="button" onClick={() => setTerm(t)}
                    className={term === t ? "rounded-xl border-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700" : "rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700"}>
                    {t} Months
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit Application →"}
              </button>
            </div>
          </form>

          {/* My Applications */}
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">My Applications</h3>
            {loading ? <p className="text-sm text-stone-400">Loading...</p> : applications.length === 0 ? (
              <p className="text-sm text-stone-400">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} onClick={() => navigate(`/loans/${app.id}`)}
                    className="flex items-center justify-between rounded-2xl border border-stone-200 p-4 cursor-pointer hover:bg-stone-50 transition">
                    <div>
                      <p className="font-semibold text-stone-900">RWF {app.requestedAmount?.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">{app.purpose}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        app.status === "APPROVED" ? "bg-green-50 text-green-700" :
                        app.status === "REJECTED" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"}`}>{app.status}</span>
                      <p className="mt-1 text-xs text-stone-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <article className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-700">Credit Score</h3>
              {creditScore && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">{creditScore.tier}</span>}
            </div>
            {loading ? <p className="mt-4 text-sm text-stone-400">Loading...</p> : creditScore ? (
              <>
                <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-sm text-stone-500">Score</p>
                  <p className="mt-1 text-3xl font-semibold text-stone-900">{creditScore.score}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-sm text-stone-500">Max Loan Limit</p>
                  <p className="mt-1 text-2xl font-semibold text-stone-900">RWF {creditScore.maxLoanAmount?.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-stone-500">No credit score yet. Add farm data to generate one.</p>
            )}
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Need Help?</h3>
            <p className="mt-2 text-sm text-stone-500">Call our dedicated support line for farmers.</p>
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
              <p className="text-lg font-semibold text-brand-700">0800 123 456</p>
              <p className="mt-1 text-xs text-stone-500">(Toll-Free in Rwanda)</p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};
