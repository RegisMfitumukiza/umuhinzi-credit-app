import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCurrentAuthUser } from "../api/auth";
import { farmerApi, type FarmerCreditScore, type FarmerCrop, type FarmerLoan, type FarmerNotification, type FarmerProductivityRecord, type FarmerRecommendation, type FarmerRepaymentSchedule, type FarmerSeason } from "../api/farmer";
import { institutionApi, type InstitutionProfile } from "../api/institutions";
import type { Farm } from "../types/farm";

const formatMoney = (value?: number | null) => `RWF ${Number(value || 0).toLocaleString()}`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const getLoanAmount = (loan: FarmerLoan) => loan.approvedAmount ?? loan.recommendedAmount ?? loan.requestedAmount ?? 0;

const getEstimatedIncome = (records: FarmerProductivityRecord[]) => {
  const first = records[0];
  const value = first?.estimatedIncome ?? first?.expectedIncome ?? first?.actualIncome;
  if (typeof value === "number") return value;
  return records.length * 250000;
};

export const FarmDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [authUser, setAuthUser] = useState(user);
  const [profile, setProfile] = useState<{ fullName?: string; province?: string | null; district?: string | null; sector?: string | null } | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [loans, setLoans] = useState<FarmerLoan[]>([]);
  const [schedules, setSchedules] = useState<FarmerRepaymentSchedule[]>([]);
  const [recommendations, setRecommendations] = useState<FarmerRecommendation[]>([]);
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [creditScore, setCreditScore] = useState<FarmerCreditScore | null>(null);
  const [productivity, setProductivity] = useState<FarmerProductivityRecord[]>([]);
  const [seasons, setSeasons] = useState<FarmerSeason[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingScore, setGeneratingScore] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const currentUser = await getCurrentAuthUser().catch(() => null);
        const [profileData, farmResponse, cropsData, loansData, schedulesData, recommendationsData, notificationsData, creditScoreData, productivityData, seasonData, activeInstitutionData] = await Promise.all([
          farmerApi.getProfile().catch(() => null),
          farmerApi.getFarms().catch(() => ({ farms: [] } as { farms: Farm[] })),
          farmerApi.getCrops().catch(() => [] as FarmerCrop[]),
          farmerApi.getLoans().catch(() => [] as FarmerLoan[]),
          farmerApi.getRepaymentSchedules().catch(() => [] as FarmerRepaymentSchedule[]),
          farmerApi.getRecommendations(4).catch(() => [] as FarmerRecommendation[]),
          farmerApi.getNotifications(4).catch(() => [] as FarmerNotification[]),
          farmerApi.getLatestCreditScore().catch(() => null),
          farmerApi.getProductivityRecords().catch(() => [] as FarmerProductivityRecord[]),
          farmerApi.getSeasons().catch(() => [] as FarmerSeason[]),
          institutionApi.getActiveInstitutions().catch(() => [] as InstitutionProfile[]),
        ]);

        const resolvedCreditScore =
          creditScoreData ?? (await farmerApi.generateCreditScore().catch(() => null));

        if (!mounted) return;

  setAuthUser(currentUser || user);
        setProfile(profileData);
        setFarms(farmResponse.farms || []);
        setCrops(cropsData);
        setLoans(loansData);
        setSchedules(schedulesData);
        setRecommendations(recommendationsData);
        setNotifications(notificationsData);
        setCreditScore(resolvedCreditScore);
        setProductivity(productivityData);
        setSeasons(seasonData);
        setInstitutions(activeInstitutionData);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateCreditScore = async () => {
    setGeneratingScore(true);
    try {
      const score = await farmerApi.generateCreditScore();
      setCreditScore(score);
    } finally {
      setGeneratingScore(false);
    }
  };

  const displayName = profile?.fullName || authUser?.fullName || "Farmer";
  const location = [profile?.district, profile?.province].filter(Boolean).join(", ") || "Your registered location";
  const activeLoans = loans.filter((loan) => ["ACTIVE", "DISBURSED", "APPROVED"].includes(String(loan.status || "").toUpperCase()));
  const pendingReminders = schedules.filter((schedule) => ["UPCOMING", "SCHEDULED", "DUE"].includes(String(schedule.status || "").toUpperCase()));
  const activeCropCount = crops.length;
  const estimatedIncome = getEstimatedIncome(productivity);
  const scoreValue = creditScore?.score ?? 0;
  const scoreRisk = creditScore?.riskLevel || creditScore?.grade || "Pending";
  const hasCreditScore = creditScore !== null;
  const scoreSummary = creditScore?.summary || "A credit score will be generated from your current farm records.";

  const topCrops = useMemo(() => crops.slice(0, 3), [crops]);
  const topRecommendations = useMemo(() => recommendations.slice(0, 3), [recommendations]);
  const topNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);
  const topSeasons = useMemo(() => seasons.slice(0, 3), [seasons]);
  const topInstitutions = useMemo(() => institutions.slice(0, 3), [institutions]);

  if (isLoading) {
    return <div className="p-6 text-sm text-stone-500">Loading farmer dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Dashboard &gt; Farmer Dashboard</p>
        <h2 className="text-2xl font-semibold text-stone-900">Farmer Dashboard</h2>
      </div>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-[linear-gradient(135deg,#d8f3dc_0%,#95d5b2_100%)] ring-4 ring-brand-100">
              <div className="flex h-full w-full items-center justify-center text-3xl">👨🏾‍🌾</div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-stone-900">{displayName}</h3>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{scoreRisk}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <span>{location}</span>
                <span>{profile?.sector || "Registered farmer"}</span>
                <span className="font-medium text-brand-600">Credit Score: {hasCreditScore ? scoreValue : "Generating your score..."}</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-stone-500">{scoreSummary}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/farms")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">View all farms</button>
            <button onClick={() => navigate("/farms?new=1")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Add farm</button>
            <button onClick={() => navigate("/analytics")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">View analytics</button>
            <button onClick={() => navigate("/recommendations")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Open recommendations</button>
            <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Apply for loan</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Farm records</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{farms.length}</h3>
          <p className="mt-1 text-sm text-stone-500">Total farms in your account</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Manage farms</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => navigate("/farms?new=1")} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Create farm</button>
            <button onClick={() => navigate("/farms")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">View farms</button>
          </div>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Latest farm</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">{farms[0]?.name || "No farms yet"}</h3>
          <p className="mt-1 text-sm text-stone-500">Open a farm to edit or delete it</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Credit score</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{hasCreditScore ? scoreValue : "Generating..."}</h3>
          <p className="mt-1 text-sm text-stone-500">{scoreRisk}</p>
          <button
            type="button"
            onClick={() => void handleGenerateCreditScore()}
            disabled={generatingScore}
            className="mt-4 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-70"
          >
            {generatingScore ? "Generating..." : creditScore ? "Refresh score" : "Generate score"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="mt-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          >
            View score details
          </button>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Active crops</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{activeCropCount}</h3>
          <p className="mt-1 text-sm text-stone-500">Tracked from crop records</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Current loans</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{activeLoans.length}</h3>
          <p className="mt-1 text-sm text-stone-500">loan portfolio</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Estimated income</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">{formatMoney(estimatedIncome)}</h3>
          <p className="mt-1 text-sm text-stone-500">From productivity records</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Available seasons</p>
              <h3 className="mt-2 text-xl font-semibold text-stone-900">Season updates</h3>
            </div>
            <button onClick={() => navigate("/crops")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">Add crop</button>
          </div>
          <div className="mt-4 space-y-3">
            {topSeasons.map((season) => (
              <div key={season.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{season.name || "Season"} {season.year || ""}</p>
                    <p className="text-sm text-stone-500">Use this season for crop and harvest tracking.</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Live</span>
                </div>
              </div>
            ))}
            {topSeasons.length === 0 && <p className="text-sm text-stone-500">No seasons available yet. Ask administration  to create one.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Loan institutions</p>
              <h3 className="mt-2 text-xl font-semibold text-stone-900">Where you can apply</h3>
            </div>
            <button onClick={() => navigate("/loans")} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Apply</button>
          </div>
          <div className="mt-4 space-y-3">
            {topInstitutions.map((institution) => (
              <div key={institution.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{institution.name}</p>
                    <p className="text-sm text-stone-500">{institution.type}{institution.district ? ` • ${institution.district}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">ACTIVE</span>
                </div>
              </div>
            ))}
            {topInstitutions.length === 0 && <p className="text-sm text-stone-500">No active institutions available right now.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-stone-900">Active Crops</h3>
            <div className="flex gap-2">
              <button onClick={() => navigate("/crops")} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600">Record crops</button>
              <button onClick={() => navigate("/harvests")} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Track harvests</button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {topCrops.map((crop, index) => (
              <article key={crop.id} className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-panel">
                <div className="h-36 bg-[linear-gradient(135deg,#5aa95b_0%,#2d6a4f_45%,#d9ed92_100%)]" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">{crop.cropName || crop.cropType || `Crop ${index + 1}`}</h4>
                      <p className="mt-1 text-sm text-stone-500">{crop.farm?.name || crop.cropType || "Active crop record"}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{crop.status || "ACTIVE"}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                    <span>PLANTING DATE</span>
                    <span className="font-semibold text-brand-700">{formatDate(crop.plantingDate)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(30, (crop.estimatedArea || 1) * 20))}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700">Harvest: {formatDate(crop.expectedHarvestDate)}</span>
                    <button onClick={() => navigate("/harvests")} className="font-semibold text-brand-600">Details</button>
                  </div>
                </div>
              </article>
            ))}

            <article className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-6 text-center shadow-panel">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl text-stone-500">+</div>
                <h4 className="mt-4 text-lg font-semibold text-stone-900">Record a crop</h4>
                <p className="mt-2 text-sm text-stone-500">Log planting records to keep your credit score, income, and harvest tracking up to date.</p>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-panel">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Reminder</span>
              <p>{pendingReminders.length > 0 ? `${pendingReminders.length} repayment reminder(s) due soon.` : "No repayment reminders are due right now."}</p>
              <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">Repayments</span>
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Current Loans</h3>
              <button onClick={() => navigate("/loans")} className="text-lg font-semibold text-stone-400">+</button>
            </div>
            <div className="space-y-3">
              {activeLoans.slice(0, 3).map((loan) => (
                <div key={loan.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">{loan.purpose || "Loan application"}</p>
                      <p className="text-sm text-stone-500">{formatMoney(getLoanAmount(loan))}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{loan.status || "PENDING"}</span>
                  </div>
                </div>
              ))}
              {activeLoans.length === 0 && <p className="text-sm text-stone-500">No active loans found.</p>}
            </div>
            <button onClick={() => navigate("/loans")} className="mt-4 text-sm font-semibold text-brand-600">Apply for Loan</button>
          </section>

          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Recommendations</h3>
            <p className="mt-2 text-sm text-stone-500">Recommendations based on your profile</p>
            <div className="mt-4 space-y-3 text-sm">
              {topRecommendations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{item.title || item.type || "Recommendation"}</p>
                      <p className="mt-1 text-sm text-stone-500">{item.message || "Review this recommendation from the backend."}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.priority || "LOW"}</span>
                  </div>
                </div>
              ))}
              {topRecommendations.length === 0 && <p className="text-sm text-stone-500">No recommendations right now.</p>}
            </div>
            <button onClick={() => navigate("/recommendations")} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Open Recommendations</button>
          </section>

          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Notifications</h3>
            <p className="mt-2 text-sm text-stone-500">Newest activity</p>
            <div className="mt-4 space-y-3 text-sm">
              {topNotifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{item.title || "Notification"}</p>
                      <p className="mt-1 text-sm text-stone-500">{item.message || "View notification details in the notifications page."}</p>
                    </div>
                    <span className={item.isRead ? "rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500" : "rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"}>
                      {item.isRead ? "Read" : "New"}
                    </span>
                  </div>
                </div>
              ))}
              {topNotifications.length === 0 && <p className="text-sm text-stone-500">No notifications yet.</p>}
            </div>
            <button onClick={() => navigate("/notifications")} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Open Notifications</button>
          </section>

          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Repayment Reminders</h3>
            <div className="mt-4 space-y-3 text-sm">
              {pendingReminders.slice(0, 3).map((schedule) => (
                <div key={schedule.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">Installment {schedule.installmentNumber || "-"}</p>
                      <p className="mt-1 text-sm text-stone-500">{schedule.loan?.purpose || "Repayment schedule"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-600">{formatMoney(schedule.amountDue)}</p>
                      <p className="text-xs text-stone-500">{formatDate(schedule.dueDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReminders.length === 0 && <p className="text-sm text-stone-500">No upcoming reminders right now.</p>}
            </div>
            <button onClick={() => navigate("/payments")} className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Open Repayments</button>
          </section>
        </div>
      </section>
    </div>
  );
};
