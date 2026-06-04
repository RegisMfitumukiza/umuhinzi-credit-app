import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmerApi, type FarmerRecommendation, type FarmerRepaymentSchedule, type FarmerCreditScore, type FarmerLoan } from "../api/farmer";

type ActionCard = {
  id: string;
  icon: string;
  title: string;
  message: string;
  action: string;
  route: string;
  urgency: "critical" | "warning" | "info";
};

const buildActionCards = (
  schedules: FarmerRepaymentSchedule[],
  creditScore: FarmerCreditScore | null,
  loans: FarmerLoan[]
): ActionCard[] => {
  const cards: ActionCard[] = [];

  // Overdue repayments
  const overdue = schedules.filter((s) => (s.status || "").toUpperCase() === "OVERDUE");
  if (overdue.length > 0) {
    cards.push({
      id: "overdue",
      icon: "⚠️",
      title: `${overdue.length} Overdue Payment${overdue.length > 1 ? "s" : ""}`,
      message: `You have ${overdue.length} overdue repayment installment${overdue.length > 1 ? "s" : ""}. Each overdue payment reduces your credit score and may lead to loan default. Pay immediately to stop further score damage.`,
      action: "Go to Payments",
      route: "/payments",
      urgency: "critical",
    });
  }

  // Upcoming due within 7 days
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueSoon = schedules.filter((s) => {
    if ((s.status || "").toUpperCase() === "PAID") return false;
    if (!s.dueDate) return false;
    const due = new Date(s.dueDate);
    return due >= today && due <= in7Days;
  });
  if (dueSoon.length > 0) {
    const next = dueSoon[0];
    const dueDate = next.dueDate ? new Date(next.dueDate).toLocaleDateString() : "soon";
    cards.push({
      id: "due-soon",
      icon: "📅",
      title: "Repayment Due Soon",
      message: `Installment #${next.installmentNumber || "—"} of RWF ${Number(next.amountDue || 0).toLocaleString()} is due on ${dueDate}. Paying on time improves your credit score and keeps your loan in good standing.`,
      action: "Make a Payment",
      route: "/payments",
      urgency: "warning",
    });
  }

  // Low credit score
  const score = creditScore?.score ?? 0;
  if (score > 0 && score < 40) {
    cards.push({
      id: "low-score",
      icon: "📉",
      title: "Your Credit Score Is Very Low",
      message: `Your score is ${score}/100. At this level, loan applications are likely to be rejected. To improve it: submit verified harvest records, complete your farmer profile, join a cooperative, and pay all outstanding installments on time.`,
      action: "View Analytics",
      route: "/analytics",
      urgency: "critical",
    });
  } else if (score > 0 && score < 60) {
    cards.push({
      id: "medium-score",
      icon: "📊",
      title: "Improve Your Credit Score",
      message: `Your score is ${score}/100. You can increase it by: recording more harvests, completing your farm profile with GPS and soil data, maintaining on-time repayments, and ensuring your cooperative membership is active.`,
      action: "View Score Details",
      route: "/analytics",
      urgency: "warning",
    });
  }

  // Active loans with high balance
  const activeLoans = loans.filter((l) => ["ACTIVE", "DISBURSED"].includes((l.status || "").toUpperCase()));
  if (activeLoans.length > 1) {
    cards.push({
      id: "high-debt",
      icon: "💳",
      title: "Multiple Active Loans",
      message: `You currently have ${activeLoans.length} active loans. Having many loans at once increases your debt ratio and lowers your credit score. Focus on repaying your current loans before applying for new ones.`,
      action: "View Loans",
      route: "/loans",
      urgency: "warning",
    });
  }

  // No harvest records
  if (creditScore && creditScore.score !== undefined) {
    const yieldScore = (creditScore as Record<string, unknown>).yieldConsistencyScore;
    if (typeof yieldScore === "number" && yieldScore < 20) {
      cards.push({
        id: "no-harvest",
        icon: "🌾",
        title: "Submit Your Harvest Records",
        message: "Your yield consistency score is very low because you have few or no verified harvest records. Harvest records are the biggest factor in your credit score. Submit records for each crop you harvest and have your cooperative verify them.",
        action: "Record Harvests",
        route: "/harvests",
        urgency: "warning",
      });
    }
  }

  return cards;
};

const urgencyStyle = {
  critical: "border-rose-200 bg-rose-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

const urgencyBadge = {
  critical: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
};

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [backendRecs, setBackendRecs] = useState<FarmerRecommendation[]>([]);
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [recs, schedules, creditScore, loans] = await Promise.all([
          farmerApi.getRecommendations(20).catch(() => [] as FarmerRecommendation[]),
          farmerApi.getRepaymentSchedules().catch(() => []),
          farmerApi.getLatestCreditScore().catch(() => null),
          farmerApi.getLoans().catch(() => []),
        ]);
        setBackendRecs(recs);
        setActionCards(buildActionCards(schedules, creditScore, loans));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading recommendations...</div>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-stone-900">Recommendations</h2>
        <p className="mt-1 text-sm text-stone-500">
          Actions you should take now based on your loan status and credit score.
        </p>
      </section>

      {/* Action cards based on real data */}
      {actionCards.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Actions Required</h3>
          {actionCards.map((card) => (
            <article key={card.id} className={`rounded-2xl border p-5 ${urgencyStyle[card.urgency]}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{card.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyBadge[card.urgency]}`}>
                        {card.urgency === "critical" ? "Urgent" : card.urgency === "warning" ? "Important" : "Info"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{card.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(card.route)}
                  className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {card.action}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {actionCards.length === 0 && backendRecs.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="mt-2 font-semibold text-stone-900">You are on track!</p>
          <p className="mt-1 text-sm text-stone-500">No urgent actions needed. Keep maintaining your records and on-time payments.</p>
        </div>
      )}

      {/* Backend recommendations */}
      {backendRecs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">System Recommendations</h3>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            {backendRecs.map((item) => (
              <article key={item.id} className="rounded-xl border border-stone-100 p-4 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-stone-900">{item.title || item.type || "Recommendation"}</h3>
                    <p className="mt-1 text-sm text-stone-500">{item.message}</p>
                    {item.actionLabel && item.actionUrl && (
                      <a href={item.actionUrl} className="mt-2 inline-block text-sm font-semibold text-emerald-600">
                        {item.actionLabel} →
                      </a>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                    item.priority === "HIGH" ? "bg-rose-100 text-rose-700" :
                    item.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{item.priority || "LOW"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
