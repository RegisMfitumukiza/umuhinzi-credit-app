import { useEffect, useState } from "react";
import { analyticsApi, type AnalyticsReport } from "../api/analytics";
import { useToast } from "../context/ToastContext";

const REPORT_TYPES = [
  "FARMER_GROWTH",
  "PRODUCTIVITY",
  "LOAN_ANALYTICS",
  "REGIONAL_PERFORMANCE",
  "FINANCIAL_INCLUSION",
  "REPAYMENT_PERFORMANCE",
  "COOPERATIVE_PERFORMANCE",
];

export const GovernmentReportsPage = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reportType: "FARMER_GROWTH", title: "", description: "" });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setReports(await analyticsApi.getReports());
    } catch {
      showToast("Unable to load reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.title) { showToast("Title is required", "error"); return; }
    setGenerating(true);
    try {
      await analyticsApi.generateReport({ reportType: form.reportType, title: form.title, description: form.description || undefined, visibility: "GOVERNMENT_PARTNER" });
      showToast("Report generated successfully", "success");
      setShowForm(false);
      setForm({ reportType: "FARMER_GROWTH", title: "", description: "" });
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = (report: AnalyticsReport) => {
    const data = report.data ? JSON.stringify(report.data, null, 2) : "No data";
    const blob = new Blob([`Report: ${report.title}\nType: ${report.reportType}\nGenerated: ${report.createdAt ?? "-"}\n\n${data}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading reports...</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Analytics Reports</h1>
            <p className="mt-1 text-sm text-stone-500">Generate and export national agricultural finance reports.</p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            {showForm ? "Cancel" : "+ Generate Report"}
          </button>
        </div>

        {showForm && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Generate New Report</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Report Type</span>
                <select value={form.reportType} onChange={(e) => setForm((p) => ({ ...p, reportType: e.target.value }))} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500">
                  {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Title</span>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Q3 2025 Farmer Growth Report" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Description (optional)</span>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-2 min-h-20 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" placeholder="Brief description..." />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Cancel</button>
              <button onClick={() => void handleGenerate()} disabled={generating} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              No reports generated yet. Use the button above to create one.
            </div>
          ) : reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900">{report.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{report.reportType?.replace(/_/g, " ")}</span>
                    {report.visibility && <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">{report.visibility}</span>}
                  </div>
                  {report.createdAt && <p className="mt-2 text-xs text-stone-400">Generated: {new Date(report.createdAt).toLocaleString()}</p>}
                </div>
                <button onClick={() => handleExportCSV(report)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700">Export</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default GovernmentReportsPage;
