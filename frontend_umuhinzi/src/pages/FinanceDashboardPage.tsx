import React, { useEffect, useMemo, useState } from "react";
import { applications as defaultApplications } from "./CooperativeApplicationsPage";
import { loadApplications, saveApplications, updateApplicationStatus, disburseApplication, exportApplicationsCSV, Application } from "../utils/localStorage";

const metricsFromApps = (apps: Application[]) => {
  const total = apps.length;
  const approved = apps.filter((a) => a.status === "Approved").length;
  const disbursed = apps.filter((a) => a.status === "Disbursed").length;
  const value = apps.reduce((s, a) => s + Number(a.amount.replace(/,/g, "")), 0);
  return {
    total,
    approved,
    disbursed,
    value: `RWF ${Number(value).toLocaleString()}`,
  };
};

export const FinanceDashboardPage = () => {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    const loaded = loadApplications(defaultApplications as Application[]);
    setApps(loaded);
  }, []);

  useEffect(() => {
    saveApplications(apps);
  }, [apps]);

  const metrics = useMemo(() => metricsFromApps(apps), [apps]);

  function handleUpdateStatus(id: string, status: string) {
    const updated = updateApplicationStatus(id, status);
    if (updated) setApps((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function handleDisburse(id: string) {
    disburseApplication(id);
    setApps((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Disbursed" } : p)));
  }

  function handleExportCSV() {
    const csv = exportApplicationsCSV(apps);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Financial Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">Welcome back. Here is the overview of the loan portfolio for Q3 2024.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Export CSV</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">New Review Process</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Active Portfolio</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.value}</div>
            <div className="mt-1 text-xs text-stone-400">Portfolio value</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Active Farmers</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{metrics.total}</div>
            <div className="mt-1 text-xs text-stone-400">Active applications</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">NPL Ratio</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">3.1%</div>
            <div className="mt-1 text-xs text-stone-400">Non-performing loans</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Loan Recovery</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">96.4%</div>
            <div className="mt-1 text-xs text-stone-400">Recovery rate</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Financial Performance</h2>
              <div className="text-sm text-stone-500">Monthly</div>
            </div>
            <div className="h-60 w-full bg-gradient-to-b from-emerald-50 to-white rounded-lg" />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Portfolio by Sector</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-28 w-28 rounded-full bg-emerald-50" />
                <div className="flex-1">
                  <div className="text-sm">Coffee</div>
                  <div className="text-sm">Maize</div>
                  <div className="text-sm">Tea</div>
                  <div className="text-sm">Livestock</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Regional Risk Index</div>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div className="flex items-center justify-between"><span>Northern Province</span><span>LOW</span></div>
                <div className="flex items-center justify-between"><span>Southern Province</span><span>MEDIUM</span></div>
                <div className="flex items-center justify-between"><span>Western Province</span><span>HIGH</span></div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.45fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Recent Applications</h3>
              <a className="text-sm text-emerald-600">View All</a>
            </div>

            <div className="space-y-3">
              {apps.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 border-b border-stone-100 py-3">
                  <div>
                    <div className="font-semibold text-stone-900">{a.farmer}</div>
                    <div className="text-xs text-stone-500">{a.amount} • {a.crop} • {a.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-stone-500">{a.status}</div>
                    {a.status !== "Approved" && a.status !== "Disbursed" && (
                      <>
                        <button onClick={() => handleUpdateStatus(a.id, "Approved")} className="rounded-full border border-stone-200 px-3 py-1 text-sm text-emerald-700">Approve</button>
                        <button onClick={() => handleUpdateStatus(a.id, "Rejected")} className="rounded-full border border-stone-200 px-3 py-1 text-sm text-rose-700">Reject</button>
                      </>
                    )}
                    {a.status === "Approved" && (
                      <button onClick={() => handleDisburse(a.id)} className="rounded-full bg-emerald-600 px-3 py-1 text-sm text-white">Disburse</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-stone-500">Notifications</div>
            <div className="mt-3 space-y-2 text-sm text-stone-600">
              <div>5 high-priority requests awaiting your review</div>
              <div>2 loans ready for disbursement</div>
              <div>3 institutions requested updated reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
