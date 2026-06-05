import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cooperativeMembersApi } from "../api/cooperativeMembers";
import { getCurrentUserProfile } from "../api/users";
import { getLoanApplicationById, type LoanApplicationUi } from "../api/loanApplications";

const statusStyles: Record<string, string> = {
  Pending: "bg-stone-100 text-stone-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  Cancelled: "bg-stone-200 text-stone-700",
};

export const CooperativeApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<LoanApplicationUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        if (!id) {
          setError("Application ID is missing.");
          return;
        }

        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;

        if (!cooperativeId) {
          setError("This cooperative manager does not have a cooperative profile linked yet.");
          return;
        }

        const [memberRows, loanApplication] = await Promise.all([
          cooperativeMembersApi.getMyCooperativeMembers().catch(() => []),
          getLoanApplicationById(id),
        ]);

        const memberFarmerIds = new Set(memberRows.map((member) => member.farmerId));
        if (!loanApplication.farmerId || !memberFarmerIds.has(loanApplication.farmerId)) {
          setError("This application does not belong to your cooperative.");
          return;
        }

        setApplication(loanApplication);
      } catch {
        setError("Unable to load the selected application.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const statusClass = useMemo(() => statusStyles[application?.status || "Pending"] || statusStyles.Pending, [application?.status]);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading application details...</div>;
  }

  if (error || !application) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-600">{error || "Application not found."}</p>
            <button onClick={() => navigate(-1)} className="mt-4 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700">
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-sm text-stone-500">← Back to Table</button>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Application {application.id}</h1>
              <p className="text-sm text-stone-500">Real cooperative loan application.</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{application.status}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard label="Farmer" value={application.farmer} />
              <InfoCard label="Location" value={application.location} />
              <InfoCard label="Primary Crop" value={application.crop} />
              <InfoCard label="Requested Amount" value={`RWF ${application.requestedAmount?.toLocaleString() || application.amount}`} />
              <InfoCard label="Recommended Amount" value={`RWF ${application.approvedAmount?.toLocaleString() || application.amount}`} />
              <InfoCard label="Credit Score" value={application.scoreValue} helper={application.riskLevel || application.scoreLabel} />
              <InfoCard label="Submission Date" value={application.date} />
              <InfoCard label="Institution" value={application.institution || "-"} />
            </div>

            {application.purposeDescription && (
              <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                <div className="text-sm font-semibold text-stone-900">Purpose Description</div>
                <p className="mt-2 text-sm text-stone-600">{application.purposeDescription}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm text-stone-500">Reviewed By</div>
                <div className="mt-1 font-semibold text-stone-900">{application.reviewedBy || "Not reviewed yet"}</div>
              </div>
              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm text-stone-500">Reviewed At</div>
                <div className="mt-1 font-semibold text-stone-900">{application.reviewedAt || "-"}</div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Application Status</h2>
              <p className="mt-2 text-sm text-stone-600">This data  only shows applications that belong to your cooperative members.</p>
              <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                Current status: <span className="font-semibold text-stone-900">{application.status}</span>
              </div>
            </article>

            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Decision Notes</h2>
              <p className="mt-2 text-sm text-stone-600">Use the applications list to approve or reject this application. The detailed reason appears in the list after update.</p>
              <button onClick={() => navigate("/cooperatives/applications")} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">
                Back to Applications
              </button>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, helper }: { label: string; value: string; helper?: string }) => (
  <div className="rounded-2xl border border-stone-100 p-4">
    <div className="text-sm text-stone-500">{label}</div>
    <div className="mt-1 font-semibold text-stone-900">{value}</div>
    {helper && <div className="mt-1 text-xs text-stone-500">{helper}</div>}
  </div>
);

export default CooperativeApplicationDetailsPage;
