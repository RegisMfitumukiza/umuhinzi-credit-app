import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getLoanApplicationById, updateLoanApplicationStatus, type LoanApplicationUi } from "../api/loanApplications";
import { useToast } from "../context/ToastContext";

export const FinanceApplicationDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const locationApplication = (location.state as { application?: LoanApplicationUi } | null)?.application ?? null;
  const [application, setApplication] = useState<LoanApplicationUi | null>(locationApplication);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        if (!id) return;
        if (locationApplication) {
          setLoading(false);
          return;
        }

        const data = await getLoanApplicationById(id);
        setApplication(data);
      } catch {
        if (!locationApplication) {
          showToast("Unable to load application details", "error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, locationApplication, showToast]);

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    if (!id || !application) return;

    if (status === "REJECTED" && !rejectionReason.trim()) {
      showToast("Rejection reason is required", "error");
      return;
    }

    setSaving(true);
    try {
      const needsReviewStep = application.status === "Pending" || application.status === "PENDING";
      const approvedAmount =
        (application.approvedAmount ?? application.requestedAmount ?? Number(application.amount.replace(/,/g, ""))) || 0;
      const terms = status === "APPROVED"
        ? { approvedAmount, interestRate: 0, totalPayable: approvedAmount }
        : undefined;
      const updated = needsReviewStep
        ? await updateLoanApplicationStatus(id, "UNDER_REVIEW").then(() =>
            updateLoanApplicationStatus(id, status, status === "REJECTED" ? rejectionReason.trim() : undefined, terms)
          )
        : await updateLoanApplicationStatus(id, status, status === "REJECTED" ? rejectionReason.trim() : undefined, terms);

      setApplication(updated);
      showToast(`Application ${status.toLowerCase()} successfully`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update application status", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading application details...</div>;
  }

  if (!application) {
    return <div className="p-6 text-sm text-stone-500">Application not found.</div>;
  }

  const score = application.scoreValue !== "-" ? application.scoreValue : "0";
  const risk = application.riskLevel || application.scoreLabel || "Pending";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sm text-stone-500">← Back to Table</button>
          <h1 className="text-2xl font-semibold text-stone-900">App {application.id} • {application.status}</h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">Schedule Site Visit</button>
            <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">View Version History</button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-100 text-3xl font-semibold text-stone-700">
                  {application.farmer.slice(0, 1)}
                </div>
                <div>
                  <div className="text-xl font-semibold text-stone-900">{application.farmer}</div>
                  <div className="text-xs text-stone-500">Farmer application overview</div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Live loan application</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Farmer ID</div>
                  <div className="mt-1 font-semibold text-stone-900">{application.farmerId || "-"}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Location</div>
                  <div className="mt-1 font-semibold text-stone-900">{application.location}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Primary Crop</div>
                  <div className="mt-1 font-semibold text-stone-900">{application.crop}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Loan Amount</div>
                  <div className="mt-1 font-semibold text-stone-900">RWF {application.amount}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Submission Date</div>
                  <div className="mt-1 font-semibold text-stone-900">{application.date}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Current Status</div>
                  <div className="mt-1 font-semibold text-stone-900">{application.status}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                  <button className="text-sm font-semibold text-stone-900">Farm Productivity</button>
                  <button className="text-sm text-stone-500">Document Viewer</button>
                  <button className="text-sm text-stone-500">Financial Records</button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Application Purpose</div>
                    <div className="mt-4 text-base font-semibold text-stone-900">{application.crop}</div>
                    <div className="mt-3 text-xs text-stone-400">Requested through  loan application</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Amount Requested</div>
                    <div className="mt-4 text-base font-semibold text-stone-900">RWF {application.amount}</div>
                    <div className="mt-3 text-xs text-stone-400">Current loan request value</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Credit Score</div>
                    <div className="mt-4 text-base font-semibold text-stone-900">{score}</div>
                    <div className="mt-3 text-xs text-stone-400">{risk}</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Reference</div>
                    <div className="mt-4 text-base font-semibold text-stone-900">{application.id}</div>
                    <div className="mt-3 text-xs text-stone-400">Application ID</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-stone-900">Verification Checklist</h4>
                  <div className="mt-3 space-y-3 text-sm text-stone-600">
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked readOnly /> <span>Identity Verified</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked readOnly /> <span>Collateral Value Confirmed</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked readOnly /> <span>Yield Estimate Validation</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" readOnly /> <span>Risk Assessment Complete</span></div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-stone-100 p-5">
                <div className="text-sm font-semibold text-stone-900">CREDIT READINESS SCORE</div>
                <div className="mt-4 text-4xl font-semibold text-emerald-600">{score}</div>
                <div className="mt-3 text-xs text-stone-500">live score for this application</div>
              </div>

              <div className="rounded-2xl border border-stone-100 p-4">
                <h5 className="text-sm font-semibold text-stone-900">Risk Indicators</h5>
                <div className="mt-3 text-sm text-stone-600">• {risk}</div>
                <div className="mt-2 text-sm text-stone-600">• Application status: {application.status}</div>
              </div>

              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm font-semibold text-stone-900">Approver Notes</div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-3 min-h-24 w-full rounded-xl border border-stone-200 p-3 text-sm"
                  placeholder="Provide justification for your decision..."
                />
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDecision("APPROVED")}
                    disabled={saving}
                    className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Approve Loan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision("REJECTED")}
                    disabled={saving}
                    className="rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-70"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceApplicationDetailsPage;
