import { useEffect, useMemo, useState } from "react";
import { cooperativeMembersApi, type CooperativeMemberApi } from "../api/cooperativeMembers";
import { getCurrentUserProfile } from "../api/users";
import { farmerApi, type FarmerYield } from "../api/farmer";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

type MemberYield = FarmerYield & {
  farmerId?: string;
  farmerName?: string;
  farmName?: string;
};

type FraudFlag = { label: string; level: "LOW" | "MEDIUM" | "HIGH" };

const detectFraud = (record: MemberYield, allMemberYields: MemberYield[]): FraudFlag[] => {
  const flags: FraudFlag[] = [];
  const farmerYields = allMemberYields.filter((y) => y.farmerId === record.farmerId);

  if (!record.crop) flags.push({ label: "Missing evidence / crop reference", level: "MEDIUM" });

  const actual = record.actualYield ?? 0;
  if (actual > 0 && farmerYields.length > 1) {
    const others = farmerYields.filter((y) => y.id !== record.id && (y.actualYield ?? 0) > 0);
    if (others.length > 0) {
      const avg = others.reduce((s, y) => s + (y.actualYield ?? 0), 0) / others.length;
      if (avg > 0 && actual > avg * 2.5) {
        flags.push({ label: "Yield unusually higher than historical average", level: "HIGH" });
      }
    }
  }

  const expected = record.expectedYield ?? 0;
  if (expected > 0 && actual > expected * 3) {
    flags.push({ label: "Harvest exceeds plausible farm capacity", level: "HIGH" });
  }

  const sameDate = allMemberYields.filter(
    (y) => y.farmerId === record.farmerId && y.id !== record.id && y.harvestDate === record.harvestDate
  );
  if (sameDate.length > 0) {
    flags.push({ label: "Duplicate harvest submission on same date", level: "MEDIUM" });
  }

  return flags;
};

const riskLevelColor = (level: "LOW" | "MEDIUM" | "HIGH") => {
  if (level === "HIGH") return "bg-rose-100 text-rose-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-stone-100 text-stone-600";
};

const overallRisk = (flags: FraudFlag[]): "LOW" | "MEDIUM" | "HIGH" => {
  if (flags.some((f) => f.level === "HIGH")) return "HIGH";
  if (flags.some((f) => f.level === "MEDIUM")) return "MEDIUM";
  return "LOW";
};

export const CooperativeHarvestVerificationPage = () => {
  const { showToast } = useToast();
  const [memberYields, setMemberYields] = useState<MemberYield[]>([]);
  const [members, setMembers] = useState<CooperativeMemberApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "FLAGGED">("ALL");

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;
        if (!cooperativeId) return;

        const memberRows = await cooperativeMembersApi.getMyCooperativeMembers().catch(() => [] as CooperativeMemberApi[]);
        setMembers(memberRows);

        const yieldPromises = memberRows.map(async (member) => {
          try {
            const res = await api.get<{ data: FarmerYield[] }>(`/yields?farmerId=${member.farmerId}&limit=50`);
            const yields: FarmerYield[] = res.data?.data || [];
            return yields.map((y) => ({
              ...y,
              farmerId: member.farmerId,
              farmerName: member.farmer?.user?.fullName || "Farmer",
              farmName: y.crop?.farm?.name,
            }));
          } catch {
            return [] as MemberYield[];
          }
        });

        const nested = await Promise.all(yieldPromises);
        setMemberYields(nested.flat());
      } catch {
        showToast("Unable to load harvest data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const enriched = useMemo(() =>
    memberYields.map((y) => ({
      yield: y,
      flags: detectFraud(y, memberYields),
    })),
    [memberYields]
  );

  const displayed = useMemo(() =>
    filter === "FLAGGED" ? enriched.filter((e) => e.flags.length > 0) : enriched,
    [enriched, filter]
  );

  const stats = useMemo(() => ({
    total: enriched.length,
    flagged: enriched.filter((e) => e.flags.length > 0).length,
    highRisk: enriched.filter((e) => overallRisk(e.flags) === "HIGH").length,
    members: members.length,
  }), [enriched, members]);

  const handleGenerateScore = async (farmerId: string, farmerName: string) => {
    setGeneratingFor(farmerId);
    try {
      await farmerApi.generateCreditScore();
      showToast(`Credit score generation triggered for ${farmerName}`, "success");
    } catch {
      showToast(`Failed to generate score for ${farmerName}`, "error");
    } finally {
      setGeneratingFor(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading harvest verification data...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Harvest Verification</h2>
          <p className="mt-2 text-sm text-stone-500">
            Review member harvest records. Flagged records may indicate fraud. Approve by generating credit score.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "ALL" ? "bg-emerald-500 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
          >
            All Records
          </button>
          <button
            onClick={() => setFilter("FLAGGED")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "FLAGGED" ? "bg-rose-500 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
          >
            Flagged Only ({stats.flagged})
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Harvest Records", value: stats.total },
          { label: "Member Farmers", value: stats.members },
          { label: "Flagged Records", value: stats.flagged },
          { label: "High Risk Records", value: stats.highRisk },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{s.label}</p>
            <h3 className="mt-2 text-3xl font-semibold text-stone-900">{s.value}</h3>
          </div>
        ))}
      </section>

      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          {filter === "FLAGGED" ? "No flagged harvest records found." : "No harvest records found for your cooperative members."}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(({ yield: record, flags }) => {
            const risk = overallRisk(flags);
            return (
              <article key={record.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-stone-900">{record.farmerName}</h3>
                      <span className="text-sm text-stone-500">•</span>
                      <span className="text-sm text-stone-600">{record.crop?.cropName || "Crop record"}</span>
                      {record.farmName && (
                        <>
                          <span className="text-sm text-stone-500">•</span>
                          <span className="text-sm text-stone-500">{record.farmName}</span>
                        </>
                      )}
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskLevelColor(risk)}`}>
                        Risk: {risk}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4 text-sm">
                      <div className="rounded-xl border border-stone-100 p-3">
                        <p className="text-stone-500">Actual Yield</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.actualYield ?? "-"} {record.unit || "kg"}</p>
                      </div>
                      <div className="rounded-xl border border-stone-100 p-3">
                        <p className="text-stone-500">Expected Yield</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.expectedYield ?? "-"} {record.unit || "kg"}</p>
                      </div>
                      <div className="rounded-xl border border-stone-100 p-3">
                        <p className="text-stone-500">Quality Grade</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.qualityGrade || "-"}</p>
                      </div>
                      <div className="rounded-xl border border-stone-100 p-3">
                        <p className="text-stone-500">Harvest Date</p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {record.harvestDate ? new Date(record.harvestDate).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>

                    {flags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Fraud Indicators</p>
                        <div className="flex flex-wrap gap-2">
                          {flags.map((flag, i) => (
                            <span key={i} className={`rounded-full px-3 py-1 text-xs font-semibold ${riskLevelColor(flag.level)}`}>
                              ⚠ {flag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <button
                      onClick={() => void handleGenerateScore(record.farmerId!, record.farmerName!)}
                      disabled={generatingFor === record.farmerId}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                    >
                      {generatingFor === record.farmerId ? "Generating..." : "Approve & Update Score"}
                    </button>
                    <p className="text-xs text-stone-400 lg:text-right">
                      Approving generates credit score for this farmer
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CooperativeHarvestVerificationPage;
