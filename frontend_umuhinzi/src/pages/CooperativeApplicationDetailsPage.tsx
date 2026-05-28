import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/http";

type Application = {
  id: string; amount: number; purpose: string; status: string;
  repaymentPeriodMonths: number; createdAt: string; reviewNotes?: string;
  farmer?: { fullName: string; email: string; phone?: string; district?: string; province?: string };
  creditScore?: { score: number; tier: string; maxLoanAmount: number };
};

export const CooperativeApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/v1/loan-applications/${id}`)
      .then((res) => { setApp(res.data.data); setNotes(res.data.data?.reviewNotes ?? ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (status: "APPROVED" | "REJECTED" | "DISBURSED") => {
    if (!id) return;
    setActionLoading(status);
    setMsg("");
    try {
      const res = await api.patch(`/v1/loan-applications/${id}/status`, { status, reviewNotes: notes });
      setApp(res.data.data);
      setMsg(`Application ${status.toLowerCase()} successfully.`);
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Action failed.");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <p className="p-6 text-sm text-stone-500">Loading...</p>;
  if (!app) return <p className="p-6 text-sm text-red-500">Application not found.</p>;

  const statusColor = app.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
    app.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
    app.status === "DISBURSED" ? "bg-purple-100 text-purple-700" : "bg-stone-100 text-stone-700";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sm text-stone-500 hover:underline">← Back</button>
          <h1 className="text-2xl font-semibold text-stone-900">Application Review</h1>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>{app.status}</span>
        </div>

        {msg && <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.includes("failed") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{msg}</p>}

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Farmer info */}
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center text-3xl font-semibold text-stone-600">
                  {app.farmer?.fullName?.[0] ?? "?"}
                </div>
                <div>
                  <div className="text-xl font-semibold text-stone-900">{app.farmer?.fullName ?? "—"}</div>
                  <div className="text-sm text-stone-500">{app.farmer?.email}</div>
                  {app.farmer?.phone && <div className="text-sm text-stone-500">{app.farmer.phone}</div>}
                  {app.farmer?.district && <div className="mt-1 text-xs text-stone-400">{app.farmer.district}, {app.farmer.province}</div>}
                </div>
              </div>

              {/* Loan details */}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Loan Amount", `RWF ${app.amount?.toLocaleString()}`],
                  ["Purpose", app.purpose],
                  ["Repayment Period", `${app.repaymentPeriodMonths} Months`],
                  ["Applied On", new Date(app.createdAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-stone-100 p-4">
                    <div className="text-sm text-stone-500">{label}</div>
                    <div className="mt-1 font-semibold text-stone-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              {app.creditScore && (
                <div className="rounded-2xl border border-stone-100 p-5">
                  <div className="text-sm font-semibold text-stone-900">Credit Score</div>
                  <div className="mt-3 text-4xl font-semibold text-emerald-600">{app.creditScore.score}</div>
                  <div className="mt-1 text-sm text-stone-500">Tier: {app.creditScore.tier}</div>
                  <div className="mt-2 text-sm text-stone-500">Max Limit: RWF {app.creditScore.maxLoanAmount?.toLocaleString()}</div>
                </div>
              )}

              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm font-semibold text-stone-900 mb-3">Decision Notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-emerald-400 resize-none"
                  placeholder="Provide justification for your decision..."
                  disabled={app.status === "APPROVED" || app.status === "REJECTED" || app.status === "DISBURSED"}
                />
                {(app.status === "PENDING" || app.status === "UNDER_REVIEW") && (
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => handleAction("APPROVED")}
                      disabled={!!actionLoading}
                      className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {actionLoading === "APPROVED" ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction("REJECTED")}
                      disabled={!!actionLoading}
                      className="rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60">
                      {actionLoading === "REJECTED" ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
                {app.status === "APPROVED" && (
                  <button
                    onClick={() => handleAction("DISBURSED")}
                    disabled={!!actionLoading}
                    className="mt-3 w-full rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {actionLoading === "DISBURSED" ? "Processing..." : "Mark as Disbursed"}
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativeApplicationDetailsPage;
