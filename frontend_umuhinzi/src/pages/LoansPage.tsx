import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoanApplications, type LoanApplicationUi } from "../api/loanApplications";
import { institutionApi, type InstitutionProfile } from "../api/institutions";
import { farmerApi, type FarmerCreditScore, type FarmerLoan } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const purposeOptions = ["SEEDS", "FERTILIZER", "EQUIPMENT", "IRRIGATION", "LIVESTOCK", "LAND_RENT", "LABOR", "TRANSPORT", "STORAGE", "OTHER"];
const BASE_LOAN_LIMIT = 500000;
const SCORE_MULTIPLIER = 15000;

const getMaximumLoanAmountFromScore = (score?: number) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  return BASE_LOAN_LIMIT + normalizedScore * SCORE_MULTIPLIER;
};

export const LoansPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<LoanApplicationUi[]>([]);
  const [loans, setLoans] = useState<FarmerLoan[]>([]);
  const [creditScore, setCreditScore] = useState<FarmerCreditScore | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ requestedAmount: "", purpose: "SEEDS", purposeDescription: "", institutionId: "" });

  useEffect(() => {
    void (async () => {
      try {
        const allInstitutionsPromise = institutionApi.getAvailableInstitutions().catch(async () => {
          return institutionApi.getActiveInstitutions().catch(() => [] as InstitutionProfile[]);
        });
        const loadedApplicationsPromise = getLoanApplications().catch(() => [] as LoanApplicationUi[]);
        const loadedLoansPromise = farmerApi.getLoans().catch(() => [] as FarmerLoan[]);
        const latestScorePromise = farmerApi.getLatestCreditScore().catch(() => null);

        const [allInstitutions, loadedApplications, loadedLoans, latestScore] = await Promise.all([
          allInstitutionsPromise,
          loadedApplicationsPromise,
          loadedLoansPromise,
          latestScorePromise,
        ]);

        setApplications(loadedApplications);
        setLoans(loadedLoans);
        setCreditScore(latestScore);
        setInstitutions(allInstitutions);
        setForm((prev) => ({
          ...prev,
          institutionId: prev.institutionId || allInstitutions.find((institution) => institution.status === "ACTIVE")?.id || allInstitutions[0]?.id || "",
        }));
      } catch {
        showToast("Unable to load loan data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const activeLoans = useMemo(() => loans.filter((loan) => ["ACTIVE", "DISBURSED", "APPROVED"].includes(String(loan.status || "").toUpperCase())), [loans]);
  const maximumLoanAmount = getMaximumLoanAmountFromScore(creditScore?.score);

  const handleSubmit = async () => {
    if (!form.requestedAmount || !form.purpose) {
      showToast("Requested amount and purpose are required", "error");
      return;
    }

    const requestedAmount = Number(form.requestedAmount);
    if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      showToast("Requested amount must be greater than 0", "error");
      return;
    }

    if (requestedAmount > maximumLoanAmount) {
      showToast(`Your current loan limit is RWF ${maximumLoanAmount.toLocaleString()}`, "error");
      return;
    }

    const selectedInstitution = institutions.find((institution) => institution.id === form.institutionId);

    if (!form.institutionId) {
      showToast("Please select a finance institution", "error");
      return;
    }

    if (!selectedInstitution) {
      showToast("Selected institution is not available", "error");
      return;
    }

    if (selectedInstitution.status !== "ACTIVE") {
      showToast("Please choose an active institution", "error");
      return;
    }

    setSubmitting(true);
    try {
      await farmerApi.createLoanApplication({
        requestedAmount,
        purpose: form.purpose,
        purposeDescription: form.purposeDescription || undefined,
        institutionId: form.institutionId,
      });

      const nextApplications = await getLoanApplications();
      const nextLoans = await farmerApi.getLoans();
      setApplications(nextApplications);
      setLoans(nextLoans);
      setForm({ requestedAmount: "", purpose: "SEEDS", purposeDescription: "", institutionId: "" });
      showToast("Loan application submitted successfully", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit loan application";

      if (message.toLowerCase().includes("farmer profile") || message.toLowerCase().includes("create your farmer profile")) {
        showToast("Create your farmer profile first", "error");
        navigate("/profile");
        return;
      }

      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading loan data...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Loan Application</h2>
          <p className="mt-2 text-sm text-stone-500">Submit loan application.</p>
        </div>
        <button onClick={() => navigate("/farmer/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">Back to dashboard</button>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Credit score" value={creditScore?.score || 0} helper={creditScore?.riskLevel || creditScore?.grade || "Pending"} />
        <StatCard label="Active loans" value={activeLoans.length} helper="Backend loan list" />
        <StatCard label="Applications" value={applications.length} helper="Submitted applications" />
        <StatCard label="Eligible amount" value={maximumLoanAmount} helper="Increases with your latest credit score" currency />
      </section>

      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Available institutions</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">Choose where to apply your loan</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {institutions.length} total
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {institutions.map((institution) => (
            <button
              key={institution.id}
              type="button"
              onClick={() => institution.status === "ACTIVE" && setForm((prev) => ({ ...prev, institutionId: institution.id }))}
              disabled={institution.status !== "ACTIVE"}
              className={`rounded-2xl border p-4 text-left transition ${form.institutionId === institution.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : institution.status === "ACTIVE" ? "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40" : "cursor-not-allowed border-stone-200 bg-stone-50 opacity-70"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-stone-900">{institution.name}</div>
                  <div className="text-sm text-stone-500">{institution.type}{institution.district ? ` • ${institution.district}` : ""}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${institution.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : institution.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                  {institution.status || "PENDING"}
                </span>
              </div>
              {institution.status !== "ACTIVE" && <p className="mt-3 text-xs text-stone-500">This institution is not active yet.</p>}
            </button>
          ))}
          {institutions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 p-4 text-sm text-stone-500 md:col-span-2 xl:col-span-3">
              No institution is available right now.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
        <div className="space-y-5">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">1</div>
              <div>
                <h3 className="text-xl font-semibold text-stone-900">Loan Details</h3>
                <p className="text-sm text-stone-500">Use your live farmer data to request a loan.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Requested Amount (RWF)</span>
                    <input
                      value={form.requestedAmount}
                      onChange={(e) => setForm((prev) => ({ ...prev, requestedAmount: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                      placeholder={`e.g. ${Math.min(maximumLoanAmount, 800000).toLocaleString()}`}
                    />
                    <p className="mt-2 text-xs text-stone-500">
                      Your current loan limit is {formatMoney(maximumLoanAmount)} based on your latest credit score.
                    </p>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Purpose</span>
                  <select value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500">
                    {purposeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">Purpose Description</span>
                <textarea value={form.purposeDescription} onChange={(e) => setForm((prev) => ({ ...prev, purposeDescription: e.target.value }))} className="mt-2 min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Add context for your loan request..." />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Select Finance Institution</span>
                <select
                  value={form.institutionId}
                  onChange={(e) => setForm((prev) => ({ ...prev, institutionId: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Choose a finance institution</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id} disabled={institution.status !== "ACTIVE"}>
                      {institution.name} ({institution.type}) - {institution.status || "PENDING"}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-stone-500">Only active institutions can be selected for loan applications, but all institutions are shown here.</p>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button onClick={() => navigate("/recommendations")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Save Draft</button>
                <button onClick={() => void handleSubmit()} disabled={submitting} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-stone-900">Recent Applications</h3>
              <button onClick={() => navigate("/notifications")} className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600">Open Notifications</button>
            </div>
            <div className="space-y-3">
              {applications.slice(0, 5).map((application) => (
                <div key={application.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">{application.farmer}</p>
                      <p className="text-sm text-stone-500">{application.crop} • {application.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">RWF {application.amount}</p>
                      <p className="text-xs text-stone-500">{application.status}</p>
                    </div>
                  </div>
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-stone-500">No applications submitted yet.</p>}
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-700">Eligibility Verified</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">Live</span>
            </div>
            <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
              <p className="text-sm text-stone-500">Credit Score</p>
              <p className="mt-1 text-3xl font-semibold text-stone-900">{creditScore?.score || "-"}</p>
              <p className="mt-2 text-sm text-stone-600">{creditScore?.summary || "Backend score summary will appear here."}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
              <p className="text-sm text-stone-500">Recommended limit</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{formatMoney(maximumLoanAmount)}</p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Need Help?</h3>
            <p className="mt-2 text-sm text-stone-500">Review recommendations before applying if you want a stronger amount or better terms.</p>
            <button onClick={() => navigate("/profile")} className="mt-3 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Create / Update Farmer Profile</button>
            <button onClick={() => navigate("/recommendations")} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">View Recommendations</button>
          </article>
        </aside>
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

const formatMoney = (value: number) => `RWF ${Number(value).toLocaleString()}`;

export default LoansPage;