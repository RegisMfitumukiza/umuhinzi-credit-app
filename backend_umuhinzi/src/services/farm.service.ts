import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateFarmInput,
  UpdateFarmInput,
  UpdateFarmStatusInput,
} from "../validators/farm.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type GetFarmsOptions = {
  skip?: number;
  limit?: number;
  where?: Prisma.FarmWhereInput;
  sortOrder?: "asc" | "desc";
};

/* ─── selects ─── */

const safeFarmSelect = {
  id: true,
  farmerId: true,
  name: true,
  description: true,
  landSize: true,
  landUnit: true,
  ownershipType: true,
  soilType: true,
  status: true,
  province: true,
  district: true,
  sector: true,
  cell: true,
  village: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      crops: true,
    },
  },
} satisfies Prisma.FarmSelect;

const farmWithFarmerSelect = {
  id: true,
  farmerId: true,
  name: true,
  description: true,
  landSize: true,
  landUnit: true,
  ownershipType: true,
  soilType: true,
  status: true,
  province: true,
  district: true,
  sector: true,
  cell: true,
  village: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  farmer: {
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      crops: true,
    },
  },
} satisfies Prisma.FarmSelect;

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

const assertFarmOwnership = async (farmId: string, farmerId: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { id: true, farmerId: true },
  });

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to access this farm", 403);
  }

  return farm;
};

/* ─── create ─── */

export const createFarmService = async (
  userId: string,
  input: CreateFarmInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const farm = await prisma.farm.create({
    data: {
      farmerId,
      name: input.name,
      description: input.description,
      landSize: input.landSize,
      landUnit: input.landUnit ?? "HECTARE",
      ownershipType: input.ownershipType ?? "OWNED",
      soilType: input.soilType ?? "UNKNOWN",
      province: input.province,
      district: input.district,
      sector: input.sector,
      cell: input.cell,
      village: input.village,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    select: safeFarmSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARM",
    resourceId: farm.id,
    description: "Farm created",
    metadata: { farmName: farm.name, district: farm.district },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return farm;
};

/* ─── get my farms ─── */

export const getMyFarmsService = async (
  userId: string,
  options: Omit<GetFarmsOptions, "where"> = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10, sortOrder = "desc" } = options;

  const where: Prisma.FarmWhereInput = { farmerId };

  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      select: safeFarmSelect,
    }),
    prisma.farm.count({ where }),
  ]);

  return {
    farms,
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

/* ─── get all farms (admin) ─── */

export const getAllFarmsService = async ({
  skip = 0,
  limit = 10,
  where = {},
  sortOrder = "desc",
}: GetFarmsOptions) => {
  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      select: farmWithFarmerSelect,
    }),
    prisma.farm.count({ where }),
  ]);

  return {
    farms,
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

/* ─── get single farm ─── */

export const getFarmByIdService = async (
  farmId: string,
  userId?: string,
  isAdmin = false
) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: farmWithFarmerSelect,
  });

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);

    if (farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this farm", 403);
    }
  }

  return farm;
};

/* ─── update farm ─── */

export const updateFarmService = async (
  farmId: string,
  userId: string,
  input: UpdateFarmInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  await assertFarmOwnership(farmId, farmerId);

  const updated = await prisma.farm.update({
    where: { id: farmId },
    data: {
      name: input.name,
      description: input.description,
      landSize: input.landSize,
      landUnit: input.landUnit,
      ownershipType: input.ownershipType,
      soilType: input.soilType,
      province: input.province,
      district: input.district,
      sector: input.sector,
      cell: input.cell,
      village: input.village,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    select: safeFarmSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARM",
    resourceId: farmId,
    description: "Farm updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─── update status (admin) ─── */

export const updateFarmStatusService = async (
  farmId: string,
  input: UpdateFarmStatusInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new APIError("Farm not found", 404);
  }

  const updated = await prisma.farm.update({
    where: { id: farmId },
    data: { status: input.status },
    select: safeFarmSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "STATUS_CHANGE",
    resource: "FARM",
    resourceId: farmId,
    description: "Farm status updated",
    metadata: { previousStatus: existing.status, newStatus: input.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─── delete farm ─── */

export const deleteFarmService = async (
  farmId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    await assertFarmOwnership(farmId, farmerId);
  } else {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true },
    });
    if (!farm) throw new APIError("Farm not found", 404);
  }

  await prisma.farm.delete({ where: { id: farmId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARM",
    resourceId: farmId,
    description: "Farm deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Farm deleted successfully." };
};
