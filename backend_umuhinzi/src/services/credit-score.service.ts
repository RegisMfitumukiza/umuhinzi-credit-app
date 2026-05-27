import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { notifyCreditScoreUpdated } from "../utils/notification.helper.js";

import type { Prisma, CreditScoreFactorType, RiskLevel } from "../generated/prisma/client.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── selects ─── */

const creditScoreFactorSelect = {
  id: true,
  type: true,
  factorName: true,
  factorValue: true,
  weight: true,
  contribution: true,
  description: true,
} satisfies Prisma.CreditScoreFactorSelect;

const safeCreditScoreSelect = {
  id: true,
  farmerId: true,
  score: true,
  riskLevel: true,
  yieldConsistencyScore: true,
  farmingHistoryScore: true,
  incomeStabilityScore: true,
  repaymentBehaviorScore: true,
  productivityScore: true,
  dataCompletenessScore: true,
  summary: true,
  generatedAt: true,
  createdAt: true,
  factors: { select: creditScoreFactorSelect },
  riskAssessment: {
    select: {
      id: true,
      riskLevel: true,
      reason: true,
      recommendedAction: true,
      createdAt: true,
    },
  },
} satisfies Prisma.CreditScoreSelect;

const creditScoreWithFarmerSelect = {
  ...safeCreditScoreSelect,
  farmer: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.CreditScoreSelect;

/* ─── helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) {
    throw new APIError(
      "Farmer profile not found. Please create your farmer profile first.",
      404
    );
  }
  return farmer.id;
};

/* ─── scoring engine ─── */

const FACTOR_WEIGHTS: Record<CreditScoreFactorType, number> = {
  YIELD_CONSISTENCY: 0.2,
  FARMING_HISTORY: 0.1,
  INCOME_STABILITY: 0.15,
  REPAYMENT_BEHAVIOR: 0.2,
  PRODUCTIVITY: 0.15,
  FARM_SIZE: 0.05,
  LIVESTOCK_VALUE: 0.05,
  COOPERATIVE_MEMBERSHIP: 0.05,
  DATA_COMPLETENESS: 0.05,
};

function scoreYieldConsistency(
  yieldRecords: Array<{ actualYield: number; expectedYield: number | null }>
): { score: number; description: string } {
  if (yieldRecords.length === 0) {
    return { score: 0, description: "No yield records found" };
  }

  const withExpected = yieldRecords.filter(
    (r) => r.expectedYield != null && r.expectedYield > 0
  );

  if (withExpected.length === 0) {
    const score = Math.min(yieldRecords.length * 10, 30);
    return {
      score,
      description: `${yieldRecords.length} yield record(s) but no expected yield data for consistency analysis`,
    };
  }

  const ratios = withExpected.map((r) =>
    Math.min(r.actualYield / r.expectedYield!, 1.5)
  );
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const variance =
    ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) /
    ratios.length;
  const stddev = Math.sqrt(variance);

  const baseScore = Math.min(avgRatio, 1.0) * 80;
  const consistencyBonus = Math.max(0, (1 - stddev) * 20);
  const score = Math.min(Math.round(baseScore + consistencyBonus), 100);

  return {
    score,
    description: `Average yield ratio: ${(avgRatio * 100).toFixed(1)}% across ${withExpected.length} season(s)`,
  };
}

function scoreFarmingHistory(experienceYears: number | null): {
  score: number;
  description: string;
} {
  const years = experienceYears ?? 0;
  if (years <= 0) {
    return { score: 0, description: "No farming experience recorded" };
  }
  if (years >= 20) {
    return { score: 100, description: `${years} years of farming experience` };
  }
  const score = Math.round((years / 20) * 100);
  return { score, description: `${years} year(s) of farming experience` };
}

function scoreIncomeStability(
  summaries: Array<{ netProfit: number; cashFlowStatus: string }>
): { score: number; description: string } {
  if (summaries.length === 0) {
    return { score: 0, description: "No financial summaries found" };
  }

  const positiveCount = summaries.filter(
    (s) => s.cashFlowStatus === "POSITIVE"
  ).length;
  const ratio = positiveCount / summaries.length;
  const avgProfit =
    summaries.reduce((a, b) => a + b.netProfit, 0) / summaries.length;

  const cashFlowScore = ratio * 60;
  const profitScore = avgProfit > 0 ? 40 : avgProfit === 0 ? 20 : 0;
  const score = Math.min(Math.round(cashFlowScore + profitScore), 100);

  return {
    score,
    description: `${positiveCount} of ${summaries.length} season(s) with positive cash flow`,
  };
}

function scoreRepaymentBehavior(
  schedules: Array<{ status: string }>
): { score: number; description: string } {
  if (schedules.length === 0) {
    return { score: 50, description: "No repayment history — neutral baseline" };
  }

  const paid = schedules.filter((s) => s.status === "PAID").length;
  const overdue = schedules.filter((s) => s.status === "OVERDUE").length;
  const total = schedules.length;

  const paidRatio = paid / total;
  const overdueRatio = overdue / total;
  const score = Math.round(
    Math.max(0, paidRatio * 100 - overdueRatio * 30)
  );

  return {
    score,
    description: `${paid} paid, ${overdue} overdue out of ${total} scheduled repayment(s)`,
  };
}

function scoreProductivity(
  records: Array<{ productivityRate: number }>
): { score: number; description: string } {
  if (records.length === 0) {
    return { score: 0, description: "No productivity records found" };
  }

  const avgRate =
    records.reduce((a, b) => a + b.productivityRate, 0) / records.length;
  const score = Math.min(Math.round(avgRate), 100);

  return {
    score,
    description: `Average productivity rate: ${avgRate.toFixed(1)}% across ${records.length} season(s)`,
  };
}

function scoreFarmSize(
  farms: Array<{ landSize: number; landUnit: string }>
): { score: number; description: string } {
  if (farms.length === 0) {
    return { score: 0, description: "No farms registered" };
  }

  const ACRE_TO_HA = 0.404686;
  const SQM_TO_HA = 0.0001;

  const totalHa = farms.reduce((sum, farm) => {
    const ha =
      farm.landUnit === "ACRE"
        ? farm.landSize * ACRE_TO_HA
        : farm.landUnit === "SQUARE_METER"
        ? farm.landSize * SQM_TO_HA
        : farm.landSize;
    return sum + ha;
  }, 0);

  if (totalHa <= 0) {
    return { score: 0, description: "Farm land size not recorded" };
  }

  const score = Math.round(Math.min((totalHa / 10) * 100, 100));
  return {
    score,
    description: `Total farm size: ${totalHa.toFixed(2)} hectare(s)`,
  };
}

function scoreLivestockValue(
  livestock: Array<{
    estimatedValue: number | null;
    quantity: number;
    status: string;
  }>
): { score: number; description: string } {
  const active = livestock.filter((l) => l.status === "ACTIVE");

  if (active.length === 0) {
    return { score: 0, description: "No active livestock recorded" };
  }

  const totalValue = active.reduce(
    (sum, l) => sum + (l.estimatedValue ?? 0),
    0
  );

  if (totalValue <= 0) {
    return {
      score: 10,
      description: `${active.length} active livestock with no estimated value`,
    };
  }

  const score = Math.round(Math.min((totalValue / 1_000_000) * 100, 100));
  return {
    score,
    description: `Total livestock value: ${totalValue.toLocaleString()} RWF`,
  };
}

function scoreCooperativeMembership(membership: {
  status: string;
} | null): { score: number; description: string } {
  if (!membership) {
    return { score: 0, description: "Not a member of any cooperative" };
  }

  const statusScores: Record<string, number> = {
    ACTIVE: 100,
    PENDING: 50,
    INACTIVE: 20,
    LEFT: 10,
    REMOVED: 0,
  };

  const score = statusScores[membership.status] ?? 0;
  return {
    score,
    description: `Cooperative membership status: ${membership.status}`,
  };
}

function scoreDataCompleteness(
  farmer: {
    dateOfBirth: Date | null;
    gender: string | null;
    farmingExperienceYears: number | null;
    primaryCrop: string | null;
  },
  farmsCount: number,
  cropsCount: number
): { score: number; description: string } {
  const checks = [
    !!farmer.dateOfBirth,
    !!farmer.gender,
    (farmer.farmingExperienceYears ?? 0) > 0,
    !!farmer.primaryCrop,
    farmsCount > 0,
    cropsCount > 0,
  ];

  const filled = checks.filter(Boolean).length;
  const score = Math.round((filled / checks.length) * 100);

  return {
    score,
    description: `${filled} of ${checks.length} profile data points completed`,
  };
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "LOW";
  if (score >= 50) return "MEDIUM";
  if (score >= 30) return "HIGH";
  return "VERY_HIGH";
}

function buildRiskReason(
  factorResults: Record<CreditScoreFactorType, { score: number; description: string }>
): string {
  const weakFactors = Object.entries(factorResults)
    .filter(([, v]) => v.score < 40)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([k]) => k.toLowerCase().replace(/_/g, " "));

  if (weakFactors.length === 0) return "Strong performance across all credit factors";
  return `Low scores in: ${weakFactors.join(", ")}`;
}

function buildRecommendedAction(riskLevel: RiskLevel): string {
  const actions: Record<RiskLevel, string> = {
    LOW: "Eligible for standard loan products. Consider premium rates and higher loan limits.",
    MEDIUM:
      "Eligible for basic loan products with standard rates. Encourage more data entry and cooperative membership to improve score.",
    HIGH:
      "High-risk borrower. Consider micro-loans with shorter terms and close monitoring. Recommend yield recording and financial planning.",
    VERY_HIGH:
      "Very high risk. Not recommended for standard loan products at this time. Suggest agricultural training and data completion before reapplication.",
  };
  return actions[riskLevel];
}

/* ─── generate credit score ─── */

export const generateCreditScoreService = async (
  userId: string,
  targetFarmerId: string | undefined,
  isAdmin: boolean,
  context: RequestContext = {}
) => {
  let farmerId: string;

  if (isAdmin && targetFarmerId) {
    const farmerExists = await prisma.farmer.findUnique({
      where: { id: targetFarmerId },
      select: { id: true },
    });
    if (!farmerExists) throw new APIError("Farmer not found", 404);
    farmerId = targetFarmerId;
  } else {
    farmerId = await resolveFarmerIdFromUser(userId);
  }

  // Gather all scoring data in parallel
  const [
    farmer,
    farms,
    yieldRecords,
    financialSummaries,
    productivityRecords,
    livestock,
    cooperativeMembership,
    repaymentSchedules,
    cropsCount,
  ] = await Promise.all([
    prisma.farmer.findUnique({
      where: { id: farmerId },
      select: {
        dateOfBirth: true,
        gender: true,
        farmingExperienceYears: true,
        primaryCrop: true,
      },
    }),
    prisma.farm.findMany({
      where: { farmerId },
      select: { landSize: true, landUnit: true },
    }),
    prisma.yieldRecord.findMany({
      where: { crop: { farm: { farmerId } } },
      select: { actualYield: true, expectedYield: true },
    }),
    prisma.financialSummary.findMany({
      where: { farmerId },
      select: { netProfit: true, cashFlowStatus: true },
    }),
    prisma.productivityRecord.findMany({
      where: { farmerId },
      select: { productivityRate: true },
    }),
    prisma.livestock.findMany({
      where: { farmerId },
      select: { estimatedValue: true, quantity: true, status: true },
    }),
    prisma.cooperativeMember.findUnique({
      where: { farmerId },
      select: { status: true },
    }),
    prisma.repaymentSchedule.findMany({
      where: { loan: { farmerId } },
      select: { status: true },
    }),
    prisma.crop.count({ where: { farm: { farmerId } } }),
  ]);

  if (!farmer) throw new APIError("Farmer not found", 404);

  // Compute factor scores
  const factorResults: Record<
    CreditScoreFactorType,
    { score: number; description: string }
  > = {
    YIELD_CONSISTENCY: scoreYieldConsistency(yieldRecords),
    FARMING_HISTORY: scoreFarmingHistory(farmer.farmingExperienceYears),
    INCOME_STABILITY: scoreIncomeStability(financialSummaries),
    REPAYMENT_BEHAVIOR: scoreRepaymentBehavior(repaymentSchedules),
    PRODUCTIVITY: scoreProductivity(productivityRecords),
    FARM_SIZE: scoreFarmSize(farms),
    LIVESTOCK_VALUE: scoreLivestockValue(livestock),
    COOPERATIVE_MEMBERSHIP: scoreCooperativeMembership(cooperativeMembership),
    DATA_COMPLETENESS: scoreDataCompleteness(farmer, farms.length, cropsCount),
  };

  const totalScore = Math.round(
    Object.entries(factorResults).reduce((sum, [factorType, result]) => {
      const weight = FACTOR_WEIGHTS[factorType as CreditScoreFactorType];
      return sum + result.score * weight;
    }, 0)
  );

  const riskLevel = getRiskLevel(totalScore);
  const reason = buildRiskReason(factorResults);
  const recommendedAction = buildRecommendedAction(riskLevel);

  // Build individual factor breakdown for summary
  const summary = `Score: ${totalScore}/100. Risk: ${riskLevel}. ${reason}`;

  // Persist credit score with all factors in a single transaction
  const creditScore = await prisma.$transaction(async (tx) => {
    const score = await tx.creditScore.create({
      data: {
        farmerId,
        score: totalScore,
        riskLevel,
        yieldConsistencyScore: factorResults.YIELD_CONSISTENCY.score,
        farmingHistoryScore: factorResults.FARMING_HISTORY.score,
        incomeStabilityScore: factorResults.INCOME_STABILITY.score,
        repaymentBehaviorScore: factorResults.REPAYMENT_BEHAVIOR.score,
        productivityScore: factorResults.PRODUCTIVITY.score,
        dataCompletenessScore: factorResults.DATA_COMPLETENESS.score,
        summary,
        factors: {
          create: (
            Object.entries(factorResults) as [
              CreditScoreFactorType,
              { score: number; description: string }
            ][]
          ).map(([factorType, result]) => ({
            type: factorType,
            factorName: factorType
              .toLowerCase()
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            factorValue: result.score,
            weight: FACTOR_WEIGHTS[factorType],
            contribution: result.score * FACTOR_WEIGHTS[factorType],
            description: result.description,
          })),
        },
        riskAssessment: {
          create: {
            farmerId,
            riskLevel,
            reason,
            recommendedAction,
          },
        },
      },
      select: safeCreditScoreSelect,
    });
    return score;
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "CREATE",
    resource: "CREDIT_SCORE",
    resourceId: creditScore.id,
    description: `Credit score generated: ${totalScore}/100 (${riskLevel})`,
    metadata: { farmerId, score: totalScore, riskLevel },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify the farmer about their updated credit score
  const farmerUser = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { userId: true },
  });
  if (farmerUser?.userId) {
    await notifyCreditScoreUpdated(farmerUser.userId, totalScore, riskLevel);
  }

  return creditScore;
};

/* ─── get credit scores ─── */

export const getMyCreditScoresService = async (
  userId: string,
  { skip = 0, limit = 10 }: { skip?: number; limit?: number }
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const [creditScores, total] = await Promise.all([
    prisma.creditScore.findMany({
      where: { farmerId },
      skip,
      take: limit,
      orderBy: { generatedAt: "desc" },
      select: safeCreditScoreSelect,
    }),
    prisma.creditScore.count({ where: { farmerId } }),
  ]);

  return {
    creditScores,
    pagination: {
      total,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasNextPage: skip + limit < total,
      hasPreviousPage: skip > 0,
    },
  };
};

export const getAllCreditScoresService = async ({
  skip = 0,
  limit = 10,
}: {
  skip?: number;
  limit?: number;
}) => {
  const [creditScores, total] = await Promise.all([
    prisma.creditScore.findMany({
      skip,
      take: limit,
      orderBy: { generatedAt: "desc" },
      select: creditScoreWithFarmerSelect,
    }),
    prisma.creditScore.count(),
  ]);

  return {
    creditScores,
    pagination: {
      total,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasNextPage: skip + limit < total,
      hasPreviousPage: skip > 0,
    },
  };
};

export const getCreditScoreByIdService = async (
  creditScoreId: string,
  userId: string,
  isAdmin: boolean
) => {
  const creditScore = await prisma.creditScore.findUnique({
    where: { id: creditScoreId },
    select: creditScoreWithFarmerSelect,
  });

  if (!creditScore) throw new APIError("Credit score not found", 404);

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (creditScore.farmerId !== farmerId) {
      throw new APIError("Not authorized to view this credit score", 403);
    }
  }

  return creditScore;
};

export const getLatestCreditScoreService = async (userId: string) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const creditScore = await prisma.creditScore.findFirst({
    where: { farmerId },
    orderBy: { generatedAt: "desc" },
    select: safeCreditScoreSelect,
  });

  if (!creditScore) {
    throw new APIError(
      "No credit score found. Generate your first credit score to get started.",
      404
    );
  }

  return creditScore;
};

export const getCreditScoresByFarmerIdService = async (farmerId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer not found", 404);

  const creditScores = await prisma.creditScore.findMany({
    where: { farmerId },
    orderBy: { generatedAt: "desc" },
    select: creditScoreWithFarmerSelect,
  });

  return creditScores;
};
