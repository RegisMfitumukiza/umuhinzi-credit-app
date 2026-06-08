import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";
import { safeFarmerSelect, farmerWithUserSelect } from "../utils/selects/farmer.select.js";

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

const assertCanUseCooperative = async (cooperativeId: string) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true, status: true },
  });

  if (!cooperative) throw new APIError("Cooperative not found", 404);
  if (cooperative.status !== "ACTIVE") {
    throw new APIError("Cooperative is not active yet.", 400);
  }
};

const requestCooperativeMembership = async (
  farmerId: string,
  cooperativeId: string,
  tx: Prisma.TransactionClient = prisma
) => {
  await assertCanUseCooperative(cooperativeId);

  const existingMembership = await tx.cooperativeMember.findUnique({
    where: { farmerId },
    select: { id: true, cooperativeId: true, status: true },
  });

  if (existingMembership?.status === "ACTIVE") {
    throw new APIError("Farmer already has an active cooperative membership.", 409);
  }

  if (existingMembership?.status === "PENDING") {
    throw new APIError("Farmer already has a pending cooperative membership request.", 409);
  }

  if (existingMembership) {
    await tx.cooperativeMember.update({
      where: { id: existingMembership.id },
      data: {
        cooperativeId,
        status: "PENDING",
        joinedAt: null,
        leftAt: null,
      },
    });
    return;
  }

  await tx.cooperativeMember.create({
    data: {
      farmerId,
      cooperativeId,
      status: "PENDING",
    },
  });
};

/* ─── create ─── */

export const createFarmerProfileService = async (
  userId: string,
  input: CreateFarmerInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new APIError("User not found", 404);
  if (user.role !== "FARMER") {
    throw new APIError("Only FARMER accounts can create farmer profiles.", 403);
  }

  const existing = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    throw new APIError("Farmer profile already exists for this account", 409);
  }

  const nationalIdTaken = await prisma.farmer.findUnique({
    where: { nationalId: input.nationalId },
    select: { id: true },
  });

  if (nationalIdTaken) {
    throw new APIError("This National ID is already registered", 409);
  }

  const farmer = await prisma.$transaction(async (tx) => {
    const created = await tx.farmer.create({
      data: {
        userId,
        nationalId: input.nationalId,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        farmingExperienceYears: input.farmingExperienceYears ?? 0,
        primaryCrop: input.primaryCrop,
      },
      select: farmerWithUserSelect,
    });

    if (input.cooperativeId) {
      await requestCooperativeMembership(created.id, input.cooperativeId, tx);
    }

    return created;
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
      select: farmerWithUserSelect,
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

/* ─── search farmers (cooperative manager / institution) ─── */

export const searchFarmersService = async (q: string) => {
  return prisma.farmer.findMany({
    where: {
      OR: [
        { user: { fullName: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: 10,
    select: {
      id: true,
      status: true,
      user: { select: { fullName: true, phone: true, email: true, district: true } },
    },
  });
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

  const updatedFarmer = await prisma.$transaction(async (tx) => {
    const farmer = await tx.farmer.update({
      where: { id: farmerId },
      data: {
        nationalId: input.nationalId,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        farmingExperienceYears: input.farmingExperienceYears,
        primaryCrop: input.primaryCrop,
      },
      select: farmerWithUserSelect,
    });

    if (input.cooperativeId === null) {
      await tx.cooperativeMember.updateMany({
        where: { farmerId, status: { in: ["ACTIVE", "PENDING"] } },
        data: { status: "LEFT", leftAt: new Date() },
      });
      await tx.farmer.update({
        where: { id: farmerId },
        data: { cooperativeId: null },
      });
    } else if (input.cooperativeId) {
      await requestCooperativeMembership(farmerId, input.cooperativeId, tx);
    }

    return farmer;
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

  await triggerCreditScoreRecalculation(farmerId);

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
    select: {
      id: true,
      status: true,
      nationalId: true,
      dateOfBirth: true,
      gender: true,
      primaryCrop: true,
    },
  });

  if (!existing) {
    throw new APIError("Farmer not found", 404);
  }

  if (input.status === "VERIFIED") {
    const missing: string[] = [];
    if (!existing.dateOfBirth) missing.push("date of birth");
    if (!existing.gender) missing.push("gender");
    if (!existing.primaryCrop) missing.push("primary crop");

    const farmCount = await prisma.farm.count({ where: { farmerId } });
    if (farmCount === 0) missing.push("at least one registered farm");

    if (missing.length > 0) {
      throw new APIError(
        `Cannot verify farmer. Missing required information: ${missing.join(", ")}.`,
        400
      );
    }
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

  await triggerCreditScoreRecalculation(farmerId);

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

/* ─── profile completeness ─── */

export const getFarmerProfileCompletenessService = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: {
      id: true,
      dateOfBirth: true,
      gender: true,
      farmingExperienceYears: true,
      primaryCrop: true,
      user: {
        select: {
          phone: true,
          province: true,
          district: true,
          profileImageUrl: true,
        },
      },
    },
  });

  if (!farmer) throw new APIError("Farmer profile not found", 404);

  const [farmCount, cropCount] = await Promise.all([
    prisma.farm.count({ where: { farmerId: farmer.id } }),
    prisma.crop.count({ where: { farm: { farmerId: farmer.id } } }),
  ]);

  const checks = [
    { key: "dateOfBirth",            label: "Date of birth",          done: !!farmer.dateOfBirth },
    { key: "gender",                 label: "Gender",                 done: !!farmer.gender },
    { key: "farmingExperienceYears", label: "Farming experience",     done: (farmer.farmingExperienceYears ?? 0) > 0 },
    { key: "primaryCrop",            label: "Primary crop",           done: !!farmer.primaryCrop },
    { key: "phone",                  label: "Phone number",           done: !!farmer.user.phone },
    { key: "province",               label: "Province",               done: !!farmer.user.province },
    { key: "district",               label: "District",               done: !!farmer.user.district },
    { key: "profileImage",           label: "Profile photo",          done: !!farmer.user.profileImageUrl },
    { key: "farm",                   label: "At least one farm",      done: farmCount > 0 },
    { key: "crop",                   label: "At least one crop",      done: cropCount > 0 },
  ];

  const completedCount = checks.filter((c) => c.done).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);

  return {
    percentage,
    completedCount,
    totalChecks: checks.length,
    isReadyForVerification: missing.filter((l) =>
      ["Date of birth", "Gender", "Primary crop", "At least one farm"].includes(l)
    ).length === 0,
    items: checks,
    missing,
  };
};

/* ─── join cooperative (farmer) ─── */

export const joinCooperativeService = async (
  userId: string,
  cooperativeId: string,
  context: RequestContext = {}
) => {
  const farmerId = await resolvefarmerIdFromUser(userId);

  await prisma.$transaction(async (tx) => {
    await requestCooperativeMembership(farmerId, cooperativeId, tx);
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: farmerId,
    description: "Farmer requested cooperative membership",
    metadata: { cooperativeId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: farmerWithUserSelect,
  });

  return farmer;
};

/* ─── leave cooperative (farmer) ─── */

export const leaveCooperativeService = async (
  userId: string,
  context: RequestContext = {}
) => {
  const farmerId = await resolvefarmerIdFromUser(userId);

  const membership = await prisma.cooperativeMember.findUnique({
    where: { farmerId },
    select: { id: true, status: true, cooperativeId: true },
  });

  if (!membership || !["ACTIVE", "PENDING"].includes(membership.status)) {
    throw new APIError("No active or pending cooperative membership found.", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.cooperativeMember.update({
      where: { id: membership.id },
      data: { status: "LEFT", leftAt: new Date() },
    });
    await tx.farmer.update({
      where: { id: farmerId },
      data: { cooperativeId: null },
    });
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: farmerId,
    description: "Farmer left cooperative",
    metadata: { cooperativeId: membership.cooperativeId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: farmerWithUserSelect,
  });

  return farmer;
};
