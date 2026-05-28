import { useParams, useNavigate } from "react-router-dom";
import { applications } from "./CooperativeApplicationsPage";

export const CooperativeApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const app = applications.find((a) => a.id === id) || applications[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sm text-stone-500">← Back to Table</button>
          <h1 className="text-2xl font-semibold text-stone-900">App {app.id} • Under Review</h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">Schedule Site Visit</button>
            <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">View Version History</button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-stone-100 flex items-center justify-center text-3xl font-semibold">{app.farmer[0]}</div>
                <div>
                  <div className="text-xl font-semibold text-stone-900">{app.farmer}</div>
                  <div className="text-xs text-stone-500">{app.location}</div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Member since 2019</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Cooperative</div>
                  <div className="mt-1 font-semibold text-stone-900">Tuzamurane Musanze</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Farm Size</div>
                  <div className="mt-1 font-semibold text-stone-900">2.5 Hectares</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Primary Crop</div>
                  <div className="mt-1 font-semibold text-stone-900">{app.crop}</div>
                </div>

                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-sm text-stone-500">Loan Amount</div>
                  <div className="mt-1 font-semibold text-stone-900">RWF {app.amount}</div>
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
                    <div className="text-sm text-stone-500">Land Title Cert #4421</div>
                    <div className="mt-6 text-xs text-stone-400">PDF • Jun 2024</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">National ID - Front/Back</div>
                    <div className="mt-6 text-xs text-stone-400">Image • Jul 2024</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Crop Insurance Policy</div>
                    <div className="mt-6 text-xs text-stone-400">PDF • Aug 2024</div>
                  </div>
                  <div className="rounded-2xl border border-stone-100 p-6 text-center">
                    <div className="text-sm text-stone-500">Coop Reference Letter</div>
                    <div className="mt-6 text-xs text-stone-400">PDF • Aug 2024</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-stone-900">Verification Checklist</h4>
                  <div className="mt-3 space-y-3 text-sm text-stone-600">
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked /> <span>Identity Verified</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked /> <span>Collateral Value Confirmed</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" defaultChecked /> <span>Yield Estimate Validation</span></div>
                    <div className="flex items-center gap-3"><input type="checkbox" /> <span>Risk Assessment Complete</span></div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-stone-100 p-5">
                <div className="text-sm font-semibold text-stone-900">CREDIT READINESS SCORE</div>
                <div className="mt-4 text-4xl font-semibold text-emerald-600">74</div>
                <div className="mt-3 text-xs text-stone-500">Repayment Reliability · Production Capacity · Market Connectivity</div>
              </div>

              <div className="rounded-2xl border border-stone-100 p-4">
                <h5 className="text-sm font-semibold text-stone-900">Risk Indicators</h5>
                <div className="mt-3 text-sm text-stone-600">• Regional vulnerability: Musanze area forecasted for heavy rainfall during harvest period (Oct).</div>
                <div className="mt-2 text-sm text-stone-600">• Collateral depth: Asset valuation is slightly aggressive compared to market averages.</div>
              </div>

              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm font-semibold text-stone-900">Approver Notes</div>
                <textarea className="mt-3 min-h-24 w-full rounded-xl border border-stone-200 p-3 text-sm" placeholder="Provide justification for your decision..." />
                <div className="mt-3 flex gap-3">
                  <button className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">Approve Loan</button>
                  <button className="rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-rose-600">Reject</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativeApplicationDetailsPage;
