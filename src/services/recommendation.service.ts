import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type {
  Prisma,
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "../generated/prisma/client.js";
import type {
  CreateRecommendationInput,
  UpdateRecommendationInput,
} from "../validators/recommendation.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const safeRecommendationSelect = {
  id: true,
  farmerId: true,
  type: true,
  priority: true,
  status: true,
  title: true,
  message: true,
  actionLabel: true,
  actionUrl: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RecommendationSelect;

const recommendationWithFarmerSelect = {
  ...safeRecommendationSelect,
  farmer: {
    select: {
      id: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
} satisfies Prisma.RecommendationSelect;

/* ─── Helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer profile not found.", 404);
  return farmer.id;
};

/* ─────────────────────────────────────────
   CREATE RECOMMENDATION (ADMIN)
───────────────────────────────────────── */

export const createRecommendationService = async (
  userId: string,
  input: CreateRecommendationInput,
  context: RequestContext = {}
) => {
  const farmer = await prisma.farmer.findUnique({
    where: { id: input.farmerId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer not found.", 404);

  const recommendation = await prisma.recommendation.create({
    data: {
      farmerId: input.farmerId,
      type: input.type,
      priority: input.priority ?? "MEDIUM",
      title: input.title,
      message: input.message,
      actionLabel: input.actionLabel,
      actionUrl: input.actionUrl,
    },
    select: recommendationWithFarmerSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "SYSTEM",
    resourceId: recommendation.id,
    description: "Recommendation created for farmer",
    metadata: { farmerId: input.farmerId, type: input.type },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return recommendation;
};

/* ─────────────────────────────────────────
   GET RECOMMENDATIONS
───────────────────────────────────────── */

export const getRecommendationsService = async (
  userId: string,
  userRole: string,
  options: {
    skip?: number;
    limit?: number;
    status?: RecommendationStatus;
    type?: RecommendationType;
    priority?: RecommendationPriority;
  } = {}
) => {
  const { skip = 0, limit = 10, status, type, priority } = options;

  let where: Prisma.RecommendationWhereInput = {
    ...(status && { status }),
    ...(type && { type }),
    ...(priority && { priority }),
  };

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    where = { ...where, farmerId };
  }

  const [recommendations, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select:
        userRole === "FARMER" ? safeRecommendationSelect : recommendationWithFarmerSelect,
    }),
    prisma.recommendation.count({ where }),
  ]);

  return {
    recommendations,
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

/* ─────────────────────────────────────────
   GET RECOMMENDATION BY ID
───────────────────────────────────────── */

export const getRecommendationByIdService = async (
  recommendationId: string,
  userId: string,
  userRole: string
) => {
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: recommendationWithFarmerSelect,
  });

  if (!recommendation) throw new APIError("Recommendation not found.", 404);

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (recommendation.farmerId !== farmerId) {
      throw new APIError("Not authorized to access this recommendation.", 403);
    }
  }

  return recommendation;
};

/* ─────────────────────────────────────────
   UPDATE RECOMMENDATION (ADMIN)
───────────────────────────────────────── */

export const updateRecommendationService = async (
  recommendationId: string,
  input: UpdateRecommendationInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true },
  });
  if (!existing) throw new APIError("Recommendation not found.", 404);

  const updated = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.message !== undefined && { message: input.message }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.actionLabel !== undefined && { actionLabel: input.actionLabel }),
      ...(input.actionUrl !== undefined && { actionUrl: input.actionUrl }),
    },
    select: recommendationWithFarmerSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "UPDATE",
    resource: "SYSTEM",
    resourceId: recommendationId,
    description: "Recommendation updated",
    metadata: { changes: input },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─────────────────────────────────────────
   DELETE RECOMMENDATION (ADMIN)
───────────────────────────────────────── */

export const deleteRecommendationService = async (
  recommendationId: string,
  context: RequestContext = {}
) => {
  const existing = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true, farmerId: true },
  });
  if (!existing) throw new APIError("Recommendation not found.", 404);

  await prisma.recommendation.delete({ where: { id: recommendationId } });

  await writeAuditLog({
    actorId: context.actorId,
    action: "DELETE",
    resource: "SYSTEM",
    resourceId: recommendationId,
    description: "Recommendation deleted by admin",
    metadata: { farmerId: existing.farmerId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Recommendation deleted successfully." };
};

/* ─────────────────────────────────────────
   DISMISS RECOMMENDATION (FARMER)
───────────────────────────────────────── */

export const dismissRecommendationService = async (
  recommendationId: string,
  userId: string
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true, farmerId: true, status: true },
  });

  if (!recommendation) throw new APIError("Recommendation not found.", 404);
  if (recommendation.farmerId !== farmerId) {
    throw new APIError("Not authorized to dismiss this recommendation.", 403);
  }
  if (recommendation.status === "DISMISSED") {
    throw new APIError("Recommendation is already dismissed.", 409);
  }

  return prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: "DISMISSED" },
    select: safeRecommendationSelect,
  });
};

/* ─────────────────────────────────────────
   MARK RECOMMENDATION AS READ (FARMER)
───────────────────────────────────────── */

export const markRecommendationReadService = async (
  recommendationId: string,
  userId: string
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true, farmerId: true, isRead: true },
  });

  if (!recommendation) throw new APIError("Recommendation not found.", 404);
  if (recommendation.farmerId !== farmerId) {
    throw new APIError("Not authorized to update this recommendation.", 403);
  }

  return prisma.recommendation.update({
    where: { id: recommendationId },
    data: { isRead: true, readAt: new Date(), status: "READ" },
    select: safeRecommendationSelect,
  });
};

/* ─────────────────────────────────────────
   EVENT-DRIVEN RECOMMENDATION GENERATORS
   Triggered by business events across services.
───────────────────────────────────────── */

export const generateLoanApprovedRecommendation = async (
  farmerId: string,
  approvedAmount: number
) => {
  await prisma.recommendation.create({
    data: {
      farmerId,
      type: "REPAYMENT_STRATEGY",
      priority: "HIGH",
      title: "Your Loan Application Was Approved",
      message: `Your loan of ${approvedAmount.toLocaleString()} RWF has been approved and is pending disbursement. Once funds arrive, review your repayment schedule and plan each installment — on-time payments are the biggest driver of your credit score.`,
      actionLabel: "View Loan",
      actionUrl: "/loans",
    },
  });
};

export const generateLoanRejectedRecommendation = async (farmerId: string) => {
  await prisma.recommendation.create({
    data: {
      farmerId,
      type: "RISK_REDUCTION",
      priority: "HIGH",
      title: "Improve Your Profile Before Reapplying",
      message:
        "Your loan application was not approved at this time. Generate a new credit score to see exactly which factors need improvement, then reapply once your score has increased.",
      actionLabel: "Generate Credit Score",
      actionUrl: "/credit-scores/generate",
    },
  });
};

export const generateLoanDisbursedRecommendation = async (
  farmerId: string,
  disbursedAmount: number,
  firstDueDate: Date
) => {
  const dueDateStr = firstDueDate.toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await prisma.recommendation.create({
    data: {
      farmerId,
      type: "REPAYMENT_STRATEGY",
      priority: "HIGH",
      title: "Your Loan Is Active — Plan Your Repayments",
      message: `${disbursedAmount.toLocaleString()} RWF has been disbursed. Your first repayment installment is due on ${dueDateStr}. Set a reminder — missed payments will negatively affect your credit score.`,
      actionLabel: "View Repayment Schedule",
      actionUrl: "/repayments",
    },
  });
};

export const generateYieldVerifiedRecommendation = async (
  farmerId: string,
  cropName: string
) => {
  await prisma.recommendation.create({
    data: {
      farmerId,
      type: "PRODUCTIVITY",
      priority: "LOW",
      title: `${cropName} Yield Verified`,
      message: `Your ${cropName} harvest has been verified. Verified yields count towards your credit score calculation. Regenerate your credit score now to reflect this improvement.`,
      actionLabel: "Regenerate Credit Score",
      actionUrl: "/credit-scores/generate",
    },
  });
};

export const generateYieldRejectedRecommendation = async (
  farmerId: string,
  cropName: string
) => {
  await prisma.recommendation.create({
    data: {
      farmerId,
      type: "PRODUCTIVITY",
      priority: "MEDIUM",
      title: `${cropName} Yield Record Rejected`,
      message: `Your ${cropName} yield record was rejected during verification. Review the verifier's notes, correct the data, and resubmit for re-verification.`,
      actionLabel: "View Yield Records",
      actionUrl: "/yields",
    },
  });
};

export const generateMarketPriceRecommendations = async (
  cropName: string,
  pricePerUnit: number,
  unit: string,
  marketLocation: string
) => {
  // Compare to the previous price for this crop at the same location.
  // skip: 1 to step past the record just created (most recent in desc order).
  const previousPrice = await prisma.marketPrice.findFirst({
    where: {
      cropName: { equals: cropName, mode: "insensitive" },
      marketLocation: { equals: marketLocation, mode: "insensitive" },
    },
    orderBy: { recordedAt: "desc" },
    select: { pricePerUnit: true },
    skip: 1,
  });

  // Only fan-out when price rose ≥ 10 % vs last entry, or when it's the first entry
  const isNotable =
    !previousPrice || pricePerUnit >= previousPrice.pricePerUnit * 1.1;
  if (!isNotable) return;

  const farmers = await prisma.farmer.findMany({
    where: {
      primaryCrop: { equals: cropName, mode: "insensitive" },
      status: "VERIFIED",
    },
    select: { id: true },
  });
  if (farmers.length === 0) return;

  const changeNote = previousPrice
    ? ` — up from ${previousPrice.pricePerUnit.toLocaleString()} RWF/${unit}`
    : "";

  await prisma.recommendation.createMany({
    data: farmers.map((f) => ({
      farmerId: f.id,
      type: "GENERAL_ADVISORY" as RecommendationType,
      priority: "MEDIUM" as RecommendationPriority,
      title: `${cropName} Price Is Rising in ${marketLocation}`,
      message: `${cropName} is now priced at ${pricePerUnit.toLocaleString()} RWF/${unit}${changeNote} in ${marketLocation}. This may be a good time to sell stock if you have it available.`,
      actionLabel: "View Market Prices",
      actionUrl: "/market-prices",
    })),
  });
};

/* ─────────────────────────────────────────
   AUTO-GENERATE RECOMMENDATIONS (SYSTEM)
   Called after credit score generation.
───────────────────────────────────────── */

type FactorScore = { score: number; description: string };
type FactorResults = Record<string, FactorScore>;

type AutoRecommendationTemplate = {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
};

const FACTOR_TEMPLATES: Record<string, AutoRecommendationTemplate> = {
  YIELD_CONSISTENCY: {
    type: "PRODUCTIVITY",
    priority: "HIGH",
    title: "Improve Your Yield Tracking",
    message:
      "Your yield consistency score is low. Set expected yields when planting and log actual yields after every harvest to build a stronger credit profile.",
    actionLabel: "Log Yield Record",
    actionUrl: "/yields/new",
  },
  FARMING_HISTORY: {
    type: "DATA_COMPLETENESS",
    priority: "MEDIUM",
    title: "Update Your Farming Experience",
    message:
      "Your farming history score is low. Add your farming experience years to your profile so lenders can see your background.",
    actionLabel: "Update Profile",
    actionUrl: "/profile",
  },
  INCOME_STABILITY: {
    type: "FINANCIAL_IMPROVEMENT",
    priority: "HIGH",
    title: "Track Your Seasonal Income and Expenses",
    message:
      "Your income stability score is low. Log seasonal financial summaries — including revenue and expenses — to demonstrate stable income patterns to lenders.",
    actionLabel: "Add Financial Summary",
    actionUrl: "/financial-summaries/new",
  },
  REPAYMENT_BEHAVIOR: {
    type: "REPAYMENT_STRATEGY",
    priority: "CRITICAL",
    title: "Address Overdue Repayments",
    message:
      "Your repayment behavior score is low due to overdue loan installments. Making timely repayments is the fastest way to improve your credit score.",
    actionLabel: "View Repayment Schedule",
    actionUrl: "/repayments",
  },
  PRODUCTIVITY: {
    type: "PRODUCTIVITY",
    priority: "MEDIUM",
    title: "Record Your Seasonal Productivity",
    message:
      "Your productivity score is low. Log overall seasonal productivity records after each harvest to build a performance history lenders can evaluate.",
    actionLabel: "Add Productivity Record",
    actionUrl: "/productivity/new",
  },
  DATA_COMPLETENESS: {
    type: "DATA_COMPLETENESS",
    priority: "HIGH",
    title: "Complete Your Farmer Profile",
    message:
      "Your profile is incomplete. Add your date of birth, gender, primary crop, and ensure you have at least one farm and crop registered.",
    actionLabel: "Complete Profile",
    actionUrl: "/profile",
  },
  LOCATION_VERIFICATION: {
    type: "DATA_COMPLETENESS",
    priority: "MEDIUM",
    title: "Get Your Farm Location Verified",
    message:
      "Farm location verification adds credibility to your profile. Request verification from your cooperative manager or an admin.",
    actionLabel: "View Farms",
    actionUrl: "/farms",
  },
  COOPERATIVE_MEMBERSHIP: {
    type: "RISK_REDUCTION",
    priority: "MEDIUM",
    title: "Join an Agricultural Cooperative",
    message:
      "Cooperative membership can significantly boost your credit score and gives you access to group resources, training, and bulk services.",
    actionLabel: "Discover Cooperatives",
    actionUrl: "/cooperatives/discover",
  },
  LIVESTOCK_VALUE: {
    type: "GENERAL_ADVISORY",
    priority: "LOW",
    title: "Consider Adding Livestock to Your Farm",
    message:
      "Livestock ownership diversifies your agricultural assets and contributes positively to your credit profile.",
    actionLabel: "Add Livestock",
    actionUrl: "/livestock/new",
  },
  FARM_SIZE: {
    type: "GENERAL_ADVISORY",
    priority: "LOW",
    title: "Consider Expanding Your Farm Holdings",
    message:
      "Farm size is one of the credit scoring factors. Expanding your land area where feasible can improve your credit profile over time.",
  },
};

const RISK_TEMPLATES: Record<string, AutoRecommendationTemplate> = {
  VERY_HIGH: {
    type: "LOAN_AMOUNT",
    priority: "CRITICAL",
    title: "Start With Micro-Loans to Build Credit",
    message:
      "Your current risk level is very high. Starting with smaller micro-loans and shorter terms will help you build a positive repayment history and steadily improve your score.",
  },
  HIGH: {
    type: "RISK_REDUCTION",
    priority: "HIGH",
    title: "Your Credit Risk Level Is High",
    message:
      "Focus on improving your weakest credit factors before applying for large loans. Better yield records, financial tracking, and timely repayments will have the most impact.",
  },
};

const LOW_SCORE_THRESHOLD = 40;

export const autoGenerateRecommendationsFromScore = async (
  farmerId: string,
  factorResults: FactorResults,
  riskLevel: string
) => {
  const templates: AutoRecommendationTemplate[] = [];

  // Collect templates for every weak factor
  for (const [factor, result] of Object.entries(factorResults)) {
    if (result.score < LOW_SCORE_THRESHOLD && FACTOR_TEMPLATES[factor]) {
      templates.push(FACTOR_TEMPLATES[factor]);
    }
  }

  // Add a risk-level recommendation for HIGH / VERY_HIGH
  if (RISK_TEMPLATES[riskLevel]) {
    templates.push(RISK_TEMPLATES[riskLevel]);
  }

  if (templates.length === 0) return;

  // Archive existing ACTIVE auto-generated recommendations for types we're replacing
  const typesToReplace = [...new Set(templates.map((t) => t.type))] as RecommendationType[];
  await prisma.recommendation.updateMany({
    where: {
      farmerId,
      type: { in: typesToReplace },
      status: "ACTIVE",
    },
    data: { status: "ARCHIVED" },
  });

  // Bulk-create new recommendations
  await prisma.recommendation.createMany({
    data: templates.map((t) => ({
      farmerId,
      type: t.type,
      priority: t.priority,
      title: t.title,
      message: t.message,
      actionLabel: t.actionLabel ?? null,
      actionUrl: t.actionUrl ?? null,
    })),
  });
};
