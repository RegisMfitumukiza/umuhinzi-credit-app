import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

interface CreditScoreFactor {
  id: string;
  type: string;
  factorName: string;
  factorValue: number;
  weight: number;
  contribution: number;
  description: string;
}

interface RiskAssessment {
  id: string;
  riskLevel: string;
  reason: string;
  recommendedAction: string;
  createdAt: string;
}

interface CreditScore {
  id: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  summary: string;
  generatedAt: string;
  factors: CreditScoreFactor[];
  riskAssessment: RiskAssessment | null;
}

const RISK_COLOR: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  VERY_HIGH: "bg-red-100 text-red-700",
};

const RISK_LABEL: Record<string, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
  VERY_HIGH: "Very High Risk",
};

const scoreColor = (score: number) => {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  if (score >= 30) return "text-orange-500";
  return "text-red-500";
};

const barColor = (v: number) => {
  if (v >= 70) return "bg-emerald-500";
  if (v >= 50) return "bg-amber-400";
  if (v >= 30) return "bg-orange-400";
  return "bg-red-400";
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const CreditScorePage = () => {
  const { showToast } = useToast();
  const [latest, setLatest] = useState<CreditScore | null>(null);
  const [history, setHistory] = useState<CreditScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [noScore, setNoScore] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get("/credit-scores/latest"),
      api.get("/credit-scores?limit=10"),
    ]).then(([latestRes, historyRes]) => {
      if (latestRes.status === "fulfilled") {
        setLatest(latestRes.value.data.data as CreditScore);
      } else {
        setNoScore(true);
      }
      if (historyRes.status === "fulfilled") {
        const d = historyRes.value.data.data;
        setHistory(Array.isArray(d) ? d : (d?.creditScores ?? []));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/credit-scores/generate", {});
      const score = data.data as CreditScore;
      setLatest(score);
      setNoScore(false);
      setHistory((prev) => [score, ...prev].slice(0, 10));
      showToast(
        `Score: ${score.score}/100 — ${RISK_LABEL[score.riskLevel] ?? score.riskLevel}`,
        "success"
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to generate score.";
      showToast(msg, "error");
    } finally {
      setGenerating(false);
    }
  };

  const pastScores = latest ? history.filter((h) => h.id !== latest.id) : history;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Credit Score</h1>
          <p className="text-stone-500 text-sm mt-0.5">Your agricultural creditworthiness assessment</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors flex-shrink-0"
        >
          {generating ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          {generating ? "Generating…" : latest ? "Recalculate" : "Generate Score"}
        </button>
      </div>

      {/* Empty state */}
      {noScore && !latest ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-5xl font-black text-stone-200 mb-3">—</p>
          <p className="text-stone-500 font-medium">No credit score yet</p>
          <p className="text-stone-400 text-sm mt-1 max-w-xs mx-auto">
            Click "Generate Score" to calculate your creditworthiness based on your farm data.
          </p>
        </div>
      ) : latest ? (
        <>
          {/* Score overview */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center flex-shrink-0">
                <p className={`text-7xl font-black ${scoreColor(latest.score)}`}>
                  {latest.score}
                </p>
                <p className="text-stone-400 text-xs mt-0.5 font-medium">out of 100</p>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    RISK_COLOR[latest.riskLevel] ?? "bg-stone-100 text-stone-600"
                  }`}
                >
                  {RISK_LABEL[latest.riskLevel] ?? latest.riskLevel}
                </span>
                <p className="text-stone-600 text-sm leading-relaxed">{latest.summary}</p>
                <p className="text-stone-400 text-xs">Generated {fmtDate(latest.generatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Factor breakdown */}
          {latest.factors.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-5">Factor Breakdown</h2>
              <div className="flex flex-col gap-5">
                {[...latest.factors]
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((f) => (
                    <div key={f.id}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-stone-800">
                          {f.factorName}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-stone-400">
                            {(f.weight * 100).toFixed(0)}% weight
                          </span>
                          <span className="text-sm font-black text-stone-900 w-8 text-right">
                            {f.factorValue}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor(f.factorValue)}`}
                          style={{ width: `${f.factorValue}%` }}
                        />
                      </div>
                      <p className="text-xs text-stone-400 mt-1">{f.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Risk assessment */}
          {latest.riskAssessment && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-4">Risk Assessment</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                    Reason
                  </p>
                  <p className="text-sm text-stone-700">{latest.riskAssessment.reason}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                    Recommended Action
                  </p>
                  <p className="text-sm text-stone-700">
                    {latest.riskAssessment.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Previous scores */}
      {pastScores.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-900 mb-4">Previous Scores</h2>
          <div className="flex flex-col">
            {pastScores.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center justify-between gap-4 py-3 ${
                  i < pastScores.length - 1 ? "border-b border-stone-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${scoreColor(h.score)}`}>
                    {h.score}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      RISK_COLOR[h.riskLevel] ?? "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {RISK_LABEL[h.riskLevel] ?? h.riskLevel}
                  </span>
                </div>
                <span className="text-xs text-stone-400">{fmtDate(h.generatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
