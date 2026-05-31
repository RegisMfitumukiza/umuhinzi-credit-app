import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { safeFarmerSelect, farmerWithUserSelect, farmerAdminListSelect } from "../utils/selects/farmer.select.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateFarmerInput,
  UpdateFarmerInput,
  UpdateFarmerStatusInput,
  UpdateFarmerCredibilityInput,
} from "../validators/farmer.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type GetAllFarmersOptions = {
  skip?: number;
  limit?: number;
  where?: Prisma.FarmerWhereInput;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/* ─── helpers ─── */

const resolvefarmerIdFromUser = async (userId: string) => {
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

/* ─── create ─── */

export const createFarmerProfileService = async (
  userId: string,
  input: CreateFarmerInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    throw new APIError("Farmer profile already exists for this account", 409);
  }

  if (input.cooperativeId) {
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: input.cooperativeId },
      select: { id: true },
    });

    if (!cooperative) {
      throw new APIError("Cooperative not found", 404);
    }
  }

  const nationalIdTaken = await prisma.farmer.findUnique({
    where: { nationalId: input.nationalId },
    select: { id: true },
  });

  if (nationalIdTaken) {
    throw new APIError("This National ID is already registered", 409);
  }

  const farmer = await prisma.farmer.create({
    data: {
      userId,
      nationalId: input.nationalId,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      farmingExperienceYears: input.farmingExperienceYears ?? 0,
      primaryCrop: input.primaryCrop,
      cooperativeId: input.cooperativeId,
    },
    select: farmerWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARMER",
    resourceId: farmer.id,
    description: "Farmer profile created",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return farmer;
};

/* ─── get my profile ─── */

export const getMyFarmerProfileService = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: farmerWithUserSelect,
  });

  if (!farmer) {
    throw new APIError("Farmer profile not found", 404);
  }

  return farmer;
};

/* ─── get all (admin) ─── */

export const getAllFarmersService = async ({
  skip = 0,
  limit = 10,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetAllFarmersOptions) => {
  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: farmerAdminListSelect,
    }),
    prisma.farmer.count({ where }),
  ]);

  return {
    farmers,
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

/* ─── get by ID (admin) ─── */

export const getFarmerByIdService = async (farmerId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: farmerWithUserSelect,
  });

  if (!farmer) {
    throw new APIError("Farmer not found", 404);
  }

  return farmer;
};

/* ─── update my profile ─── */

export const updateMyFarmerProfileService = async (
  userId: string,
  input: UpdateFarmerInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolvefarmerIdFromUser(userId);

  if (input.nationalId) {
    const taken = await prisma.farmer.findFirst({
      where: {
        nationalId: input.nationalId,
        NOT: { userId },
      },
      select: { id: true },
    });

    if (taken) {
      throw new APIError("This National ID is already registered", 409);
    }
  }

  if (input.cooperativeId) {
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: input.cooperativeId },
      select: { id: true },
    });

    if (!cooperative) {
      throw new APIError("Cooperative not found", 404);
    }
  }

  const updatedFarmer = await prisma.farmer.update({
    where: { id: farmerId },
    data: {
      nationalId: input.nationalId,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      farmingExperienceYears: input.farmingExperienceYears,
      primaryCrop: input.primaryCrop,
      cooperativeId: input.cooperativeId,
    },
    select: farmerWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: farmerId,
    description: "Farmer profile updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updatedFarmer;
};

/* ─── update status (admin) ─── */

export const updateFarmerStatusService = async (
  farmerId: string,
  input: UpdateFarmerStatusInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new APIError("Farmer not found", 404);
  }

  const updated = await prisma.farmer.update({
    where: { id: farmerId },
    data: { status: input.status },
    select: safeFarmerSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "STATUS_CHANGE",
    resource: "FARMER",
    resourceId: farmerId,
    description: "Farmer status changed",
    metadata: { previousStatus: existing.status, newStatus: input.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─── update credibility (admin) ─── */

export const updateFarmerCredibilityService = async (
  farmerId: string,
  input: UpdateFarmerCredibilityInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true, credibilityStatus: true },
  });

  if (!existing) {
    throw new APIError("Farmer not found", 404);
  }

  const updated = await prisma.farmer.update({
    where: { id: farmerId },
    data: { credibilityStatus: input.credibilityStatus },
    select: safeFarmerSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: farmerId,
    description: "Farmer credibility status updated",
    metadata: {
      previousCredibility: existing.credibilityStatus,
      newCredibility: input.credibilityStatus,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─── farmer stats (admin) ─── */

export const getFarmerStatsService = async () => {
  const [total, pending, verified, suspended, low, medium, high, trusted] =
    await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { status: "PENDING" } }),
      prisma.farmer.count({ where: { status: "VERIFIED" } }),
      prisma.farmer.count({ where: { status: "SUSPENDED" } }),
      prisma.farmer.count({ where: { credibilityStatus: "LOW" } }),
      prisma.farmer.count({ where: { credibilityStatus: "MEDIUM" } }),
      prisma.farmer.count({ where: { credibilityStatus: "HIGH" } }),
      prisma.farmer.count({ where: { credibilityStatus: "TRUSTED" } }),
    ]);

  return {
    total,
    byStatus: { pending, verified, suspended },
    byCredibility: { low, medium, high, trusted },
  };
};
