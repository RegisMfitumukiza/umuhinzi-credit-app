import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateCropInput,
  UpdateCropInput,
  CreateSeasonInput,
} from "../validators/crop.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── selects ─── */

const safeCropSelect = {
  id: true,
  farmId: true,
  seasonId: true,
  cropName: true,
  cropType: true,
  plantingDate: true,
  expectedHarvestDate: true,
  actualHarvestDate: true,
  estimatedArea: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  season: {
    select: {
      id: true,
      name: true,
      year: true,
    },
  },
  farm: {
    select: {
      id: true,
      name: true,
      district: true,
      farmerId: true,
    },
  },
} satisfies Prisma.CropSelect;

const safeSeasonSelect = {
  id: true,
  name: true,
  year: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FarmingSeasonSelect;

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
    throw new APIError("You are not authorized to add crops to this farm", 403);
  }
};

/* ─────────────────────────────────────────
   FARMING SEASON SERVICES
───────────────────────────────────────── */

export const createSeasonService = async (
  input: CreateSeasonInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.farmingSeason.findUnique({
    where: { name_year: { name: input.name, year: input.year } },
    select: { id: true },
  });

  if (existing) {
    throw new APIError(
      `A season named "${input.name}" for year ${input.year} already exists`,
      409
    );
  }

  const season = await prisma.farmingSeason.create({
    data: {
      name: input.name,
      year: input.year,
      startDate: input.startDate,
      endDate: input.endDate,
    },
    select: safeSeasonSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "CREATE",
    resource: "SYSTEM",
    resourceId: season.id,
    description: `Farming season "${season.name} ${season.year}" created`,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return season;
};

export const getAllSeasonsService = async () => {
  return prisma.farmingSeason.findMany({
    orderBy: [{ year: "desc" }, { startDate: "asc" }],
    select: safeSeasonSelect,
  });
};

export const getSeasonByIdService = async (seasonId: string) => {
  const season = await prisma.farmingSeason.findUnique({
    where: { id: seasonId },
    select: safeSeasonSelect,
  });

  if (!season) {
    throw new APIError("Farming season not found", 404);
  }

  return season;
};

/* ─────────────────────────────────────────
   CROP SERVICES
───────────────────────────────────────── */

export const createCropService = async (
  userId: string,
  input: CreateCropInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  await assertFarmOwnership(input.farmId, farmerId);

  const season = await prisma.farmingSeason.findUnique({
    where: { id: input.seasonId },
    select: { id: true },
  });

  if (!season) {
    throw new APIError("Farming season not found", 404);
  }

  const crop = await prisma.crop.create({
    data: {
      farmId: input.farmId,
      seasonId: input.seasonId,
      cropName: input.cropName,
      cropType: input.cropType,
      plantingDate: input.plantingDate,
      expectedHarvestDate: input.expectedHarvestDate,
      estimatedArea: input.estimatedArea,
      notes: input.notes,
    },
    select: safeCropSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "CROP",
    resourceId: crop.id,
    description: "Crop record created",
    metadata: { cropName: crop.cropName, cropType: crop.cropType },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return crop;
};

export const getMyCropsService = async (
  userId: string,
  options: { skip?: number; limit?: number; farmId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10, farmId } = options;

  const where: Prisma.CropWhereInput = {
    farm: { farmerId },
    ...(farmId && { farmId }),
  };

  const [crops, total] = await Promise.all([
    prisma.crop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeCropSelect,
    }),
    prisma.crop.count({ where }),
  ]);

  return {
    crops,
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

export const getAllCropsService = async (options: {
  skip?: number;
  limit?: number;
  where?: Prisma.CropWhereInput;
} = {}) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [crops, total] = await Promise.all([
    prisma.crop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeCropSelect,
    }),
    prisma.crop.count({ where }),
  ]);

  return {
    crops,
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

export const getCropByIdService = async (
  cropId: string,
  userId?: string,
  isAdmin = false
) => {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: safeCropSelect,
  });

  if (!crop) {
    throw new APIError("Crop not found", 404);
  }

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);

    if (crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this crop", 403);
    }
  }

  return crop;
};

export const updateCropService = async (
  cropId: string,
  userId: string,
  input: UpdateCropInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: { id: true, farm: { select: { farmerId: true } } },
  });

  if (!crop) {
    throw new APIError("Crop not found", 404);
  }

  if (crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this crop", 403);
  }

  const updated = await prisma.crop.update({
    where: { id: cropId },
    data: {
      cropName: input.cropName,
      cropType: input.cropType,
      plantingDate: input.plantingDate,
      expectedHarvestDate: input.expectedHarvestDate,
      actualHarvestDate: input.actualHarvestDate,
      estimatedArea: input.estimatedArea,
      status: input.status,
      notes: input.notes,
    },
    select: safeCropSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "CROP",
    resourceId: cropId,
    description: "Crop record updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

export const deleteCropService = async (
  cropId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);

    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      select: { id: true, farm: { select: { farmerId: true } } },
    });

    if (!crop) throw new APIError("Crop not found", 404);

    if (crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this crop", 403);
    }
  } else {
    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      select: { id: true },
    });
    if (!crop) throw new APIError("Crop not found", 404);
  }

  await prisma.crop.delete({ where: { id: cropId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "CROP",
    resourceId: cropId,
    description: "Crop record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Crop deleted successfully." };
};
