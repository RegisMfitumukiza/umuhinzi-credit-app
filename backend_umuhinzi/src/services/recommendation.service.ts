import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type { CreateRecommendationInput } from "../validators/recommendation.schema.js";

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
  options: { skip?: number; limit?: number } = {}
) => {
  const { skip = 0, limit = 10 } = options;

  let where: Prisma.RecommendationWhereInput = {};

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    where = { farmerId };
  }

  const [recommendations, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: userRole === "FARMER" ? safeRecommendationSelect : recommendationWithFarmerSelect,
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

  const updated = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { isRead: true, readAt: new Date(), status: "READ" },
    select: safeRecommendationSelect,
  });

  return updated;
};
