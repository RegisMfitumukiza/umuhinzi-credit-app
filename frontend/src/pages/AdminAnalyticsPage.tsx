import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageTab = "reports" | "regional" | "audit";

type ReportType =
  | "FARMER_GROWTH"
  | "PRODUCTIVITY"
  | "LOAN_ANALYTICS"
  | "REGIONAL_PERFORMANCE"
  | "FINANCIAL_INCLUSION"
  | "REPAYMENT_PERFORMANCE"
  | "COOPERATIVE_PERFORMANCE";

type Visibility =
  | "ADMIN_ONLY"
  | "INSTITUTION"
  | "COOPERATIVE"
  | "GOVERNMENT_PARTNER"
  | "PUBLIC_SUMMARY";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_RESET"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "FILE_UPLOAD"
  | "FILE_DELETE"
  | "SYSTEM";

type AuditResource =
  | "USER"
  | "FARMER"
  | "INSTITUTION"
  | "COOPERATIVE"
  | "FARM"
  | "CROP"
  | "LOAN"
  | "REPAYMENT"
  | "CREDIT_SCORE"
  | "NOTIFICATION"
  | "AUTH"
  | "SYSTEM";

interface Report {
  id: string;
  reportType: ReportType;
  visibility: Visibility;
  title: string;
  description?: string;
  data: Record<string, unknown>;
  generatedAt: string;
  createdAt: string;
  generatedBy: { id: string; fullName: string; email: string };
}

interface AuditLog {
  id: string;
  actorId: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; email: string; role: string } | null;
}

interface AuditPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Constants & Label Helpers ────────────────────────────────────────────────

const REPORT_TYPES: ReportType[] = [
  "FARMER_GROWTH",
  "PRODUCTIVITY",
  "LOAN_ANALYTICS",
  "REGIONAL_PERFORMANCE",
  "FINANCIAL_INCLUSION",
  "REPAYMENT_PERFORMANCE",
  "COOPERATIVE_PERFORMANCE",
];

const VISIBILITIES: Visibility[] = [
  "ADMIN_ONLY",
  "INSTITUTION",
  "COOPERATIVE",
  "GOVERNMENT_PARTNER",
  "PUBLIC_SUMMARY",
];

const AUDIT_ACTIONS: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET",
  "STATUS_CHANGE",
  "ROLE_CHANGE",
  "FILE_UPLOAD",
  "FILE_DELETE",
  "SYSTEM",
];

const AUDIT_RESOURCES: AuditResource[] = [
  "USER",
  "FARMER",
  "INSTITUTION",
  "COOPERATIVE",
  "FARM",
  "CROP",
  "LOAN",
  "REPAYMENT",
  "CREDIT_SCORE",
  "NOTIFICATION",
  "AUTH",
  "SYSTEM",
];

const toWords = (s: string) =>
  s.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

const reportTypeBadge = (t: ReportType): string => {
  const map: Record<ReportType, string> = {
    FARMER_GROWTH: "bg-brand-100 text-brand-700",
    PRODUCTIVITY: "bg-lime-100 text-lime-700",
    LOAN_ANALYTICS: "bg-blue-100 text-blue-700",
    REGIONAL_PERFORMANCE: "bg-orange-100 text-orange-700",
    FINANCIAL_INCLUSION: "bg-purple-100 text-purple-700",
    REPAYMENT_PERFORMANCE: "bg-teal-100 text-teal-700",
    COOPERATIVE_PERFORMANCE: "bg-indigo-100 text-indigo-700",
  };
  return map[t] ?? "bg-stone-100 text-stone-600";
};

const visibilityBadge = (v: Visibility): string => {
  const map: Record<Visibility, string> = {
    ADMIN_ONLY: "bg-stone-800 text-white",
    INSTITUTION: "bg-blue-100 text-blue-700",
    COOPERATIVE: "bg-purple-100 text-purple-700",
    GOVERNMENT_PARTNER: "bg-orange-100 text-orange-700",
    PUBLIC_SUMMARY: "bg-brand-100 text-brand-700",
  };
  return map[v] ?? "bg-stone-100 text-stone-600";
};

const actionBadge = (a: AuditAction): string => {
  const map: Record<AuditAction, string> = {
    CREATE: "bg-brand-100 text-brand-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    LOGIN: "bg-emerald-100 text-emerald-700",
    LOGOUT: "bg-stone-100 text-stone-600",
    PASSWORD_RESET: "bg-orange-100 text-orange-700",
    STATUS_CHANGE: "bg-purple-100 text-purple-700",
    ROLE_CHANGE: "bg-indigo-100 text-indigo-700",
    FILE_UPLOAD: "bg-teal-100 text-teal-700",
    FILE_DELETE: "bg-rose-100 text-rose-700",
    SYSTEM: "bg-stone-100 text-stone-500",
  };
  return map[a] ?? "bg-stone-100 text-stone-600";
};

const resourceBadge = (r: AuditResource): string => {
  const map: Record<AuditResource, string> = {
    USER: "bg-blue-50 text-blue-600",
    FARMER: "bg-brand-50 text-brand-600",
    INSTITUTION: "bg-orange-50 text-orange-600",
    COOPERATIVE: "bg-purple-50 text-purple-600",
    FARM: "bg-lime-50 text-lime-600",
    CROP: "bg-green-50 text-green-600",
    LOAN: "bg-sky-50 text-sky-600",
    REPAYMENT: "bg-teal-50 text-teal-600",
    CREDIT_SCORE: "bg-indigo-50 text-indigo-600",
    NOTIFICATION: "bg-amber-50 text-amber-600",
    AUTH: "bg-stone-100 text-stone-500",
    SYSTEM: "bg-stone-100 text-stone-400",
  };
  return map[r] ?? "bg-stone-100 text-stone-600";
};

// ─── Regional Tab ────────────────────────────────────────────────────────────

interface RegionalData {
  farmersByProvince: Array<{ province: string | null; farmerCount: number }>;
  farmersByDistrict: Array<{ district: string | null; farmerCount: number }>;
  loansByDistrict: Array<{
    district: string | null;
    loanCount: number;
    applicationCount: number;
  }>;
  creditScoresByProvince: Array<{
    province: string;
    averageScore: number;
    scoredFarmers: number;
  }>;
}

const RegionalTab = () => {
  const [data, setData] = useState<RegionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get("/analytics/regional")
      .then((r) => setData(r.data.data as RegionalData))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
      </div>
    );
  }

  if (failed || !data) {
    return (
      <p className="text-stone-400 text-sm text-center py-12">
        Failed to load regional analytics.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Farmers by province */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-black text-stone-700">Farmers by Province</h2>
          </div>
          {data.farmersByProvince.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">Province</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Farmers</th>
                </tr>
              </thead>
              <tbody>
                {data.farmersByProvince.map((row, i) => (
                  <tr key={i} className="border-b border-stone-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-stone-900">{row.province ?? "Unknown"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-600">{row.farmerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Avg credit score by province */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-black text-stone-700">Avg Credit Score by Province</h2>
          </div>
          {data.creditScoresByProvince.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">No scored farmers yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">Province</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Avg Score</th>
                  <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Farmers</th>
                </tr>
              </thead>
              <tbody>
                {data.creditScoresByProvince.map((row, i) => (
                  <tr key={i} className="border-b border-stone-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-stone-900">{row.province}</td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-600">
                      {row.averageScore.toFixed(1)}
                    </td>
                    <td className="px-5 py-3 text-right text-stone-400">{row.scoredFarmers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Farmers by district */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-black text-stone-700">
            Farmers by District{" "}
            <span className="text-stone-400 font-normal">(top 10)</span>
          </h2>
        </div>
        {data.farmersByDistrict.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">District</th>
                <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Farmers</th>
              </tr>
            </thead>
            <tbody>
              {data.farmersByDistrict.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-stone-900">{row.district ?? "Unknown"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-600">{row.farmerCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Loans by district */}
      {data.loansByDistrict.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-black text-stone-700">Loans by Institution District</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr>
                <th className="text-left text-xs font-semibold text-stone-400 px-5 py-3">District</th>
                <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Loans</th>
                <th className="text-right text-xs font-semibold text-stone-400 px-5 py-3">Applications</th>
              </tr>
            </thead>
            <tbody>
              {data.loansByDistrict.map((row, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-stone-900">{row.district ?? "Unknown"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-600">{row.loanCount}</td>
                  <td className="px-5 py-3 text-right text-stone-400">{row.applicationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Generate Report Modal ────────────────────────────────────────────────────

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: (report: Report) => void;
}

const GenerateReportModal = ({ onClose, onGenerated }: GenerateModalProps) => {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<ReportType>("FARMER_GROWTH");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("ADMIN_ONLY");
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post("/analytics/reports", {
        reportType,
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      });
      const report: Report = data.data;
      onGenerated(report);
      showToast("Report generated successfully.", "success");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to generate report."
          : "Failed to generate report.";
      showToast(msg, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-black text-stone-900">Generate Report</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Snapshot is computed from live data and stored immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Report type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {toWords(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 2025 Farmer Growth Report"
              required
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Description <span className="text-stone-300">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this report's purpose…"
              rows={3}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {toWords(v)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────

const ReportsTab = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ReportType | "ALL">("ALL");
  const [showGenerate, setShowGenerate] = useState(false);

  useEffect(() => {
    api
      .get("/analytics/reports?limit=100")
      .then((r) => setReports(r.data.data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerated = (report: Report) => {
    setReports((prev) => [report, ...prev]);
  };

  const filtered =
    filterType === "ALL" ? reports : reports.filter((r) => r.reportType === filterType);

  const countFor = (t: ReportType) => reports.filter((r) => r.reportType === t).length;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-stone-500 text-sm">
          {reports.length} report{reports.length !== 1 ? "s" : ""} generated
        </p>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex-shrink-0 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-full transition-colors"
        >
          + Generate Report
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filterType === "ALL"
              ? "bg-stone-900 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          All ({reports.length})
        </button>
        {REPORT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === t
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {toWords(t)}
            {countFor(t) > 0 && (
              <span className="ml-1.5 opacity-70">{countFor(t)}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-stone-400 text-sm font-medium">
            {filterType === "ALL"
              ? "No reports yet. Generate your first one."
              : `No ${toWords(filterType)} reports yet.`}
          </p>
          {filterType === "ALL" && (
            <button
              onClick={() => setShowGenerate(true)}
              className="mt-1 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Generate Report
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${reportTypeBadge(report.reportType)}`}
                >
                  {toWords(report.reportType)}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${visibilityBadge(report.visibility)}`}
                >
                  {toWords(report.visibility)}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm leading-snug">{report.title}</h3>
                {report.description && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{report.description}</p>
                )}
              </div>

              <div className="bg-stone-50 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {Object.entries(report.data ?? {})
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <div key={key}>
                      <p className="text-xs text-stone-400 font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-sm font-bold text-stone-800">
                        {typeof val === "number" ? val.toLocaleString() : String(val)}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-100">
                <span>by {report.generatedBy?.fullName ?? "—"}</span>
                <span>{formatDate(report.generatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerate && (
        <GenerateReportModal
          onClose={() => setShowGenerate(false)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
};

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

const AuditLogTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<AuditPagination | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [resourceFilter, setResourceFilter] = useState<AuditResource | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const LIMIT = 20;

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource", resourceFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    setLoading(true);
    api
      .get(`/audit-logs?${params.toString()}`)
      .then((r) => {
        setLogs((r.data.data as AuditLog[]) ?? []);
        setPagination((r.data.pagination as AuditPagination) ?? null);
      })
      .catch(() => {
        setLogs([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [page, actionFilter, resourceFilter, fromDate, toDate]);

  const hasFilters = !!(actionFilter || resourceFilter || fromDate || toDate);

  const clearFilters = () => {
    setActionFilter("");
    setResourceFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value as AuditAction | "");
            setPage(1);
          }}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {toWords(a)}
            </option>
          ))}
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value as AuditResource | "");
            setPage(1);
          }}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
        >
          <option value="">All resources</option>
          {AUDIT_RESOURCES.map((r) => (
            <option key={r} value={r}>
              {toWords(r)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
          />
          <span className="text-stone-400 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400 transition-all"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            Clear filters
          </button>
        )}

        {pagination && (
          <span className="ml-auto text-xs text-stone-400 self-center">
            {pagination.total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-12">No audit logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100">
                <tr>
                  {["Actor", "Action", "Resource", "Description", "IP", "Date"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-stone-400 px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <div>
                          <p className="font-medium text-stone-900 text-xs whitespace-nowrap">
                            {log.actor.fullName}
                          </p>
                          <p className="text-stone-400 text-xs">{log.actor.role}</p>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-xs">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${actionBadge(log.action)}`}
                      >
                        {toWords(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${resourceBadge(log.resource)}`}
                      >
                        {toWords(log.resource)}
                      </span>
                      {log.resourceId && (
                        <p className="text-stone-300 text-xs mt-0.5 font-mono">
                          {log.resourceId.slice(0, 8)}…
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs max-w-xs truncate">
                      {log.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                      {log.ipAddress ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-4 py-2 rounded-full border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 rounded-full border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminAnalyticsPage = () => {
  const [tab, setTab] = useState<PageTab>("reports");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Analytics & Reports
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Platform reports and system audit trail
        </p>
      </div>

      {/* Tab bar */}
      <div className="bg-stone-100 rounded-2xl p-1 flex w-fit gap-1">
        {(["reports", "regional", "audit"] as PageTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? "bg-white shadow-sm text-stone-900"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "reports" ? "Reports" : t === "regional" ? "Regional" : "Audit Log"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "reports" && <ReportsTab />}
      {tab === "regional" && <RegionalTab />}
      {tab === "audit" && <AuditLogTab />}
    </div>
  );
};
