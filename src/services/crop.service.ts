import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";
import { refreshFinancialSummaryForSeason } from "./finance.service.js";

import type { CropStatus, LandUnit, Prisma } from "../generated/prisma/client.js";
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

const roundNumber = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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

const RWANDA_SEASON_NAMES = ["Season A", "Season B", "Season C"] as const;
type RwandaSeasonName = (typeof RWANDA_SEASON_NAMES)[number];

const ACTIVE_CROP_STATUSES: CropStatus[] = ["PLANNED", "PLANTED", "GROWING"];
const HARVEST_GRACE_DAYS = 30;

const normalizeRwandaSeasonName = (name: string): RwandaSeasonName => {
  const normalized = name.trim().replace(/\s+/g, " ").toLowerCase();

  if (normalized === "a" || normalized === "season a") return "Season A";
  if (normalized === "b" || normalized === "season b") return "Season B";
  if (normalized === "c" || normalized === "season c") return "Season C";

  throw new APIError("Season must be one of: Season A, Season B, Season C", 400);
};

const utcDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day));

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const isSameUtcDay = (left: Date, right: Date) =>
  startOfUtcDay(left).getTime() === startOfUtcDay(right).getTime();

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getRwandaSeasonWindow = (name: RwandaSeasonName, year: number) => {
  switch (name) {
    case "Season A":
      return {
        startDate: utcDate(year, 8, 1),
        endDate: utcDate(year + 1, 0, 31),
      };
    case "Season B":
      return {
        startDate: utcDate(year, 1, 1),
        endDate: utcDate(year, 5, 30),
      };
    case "Season C":
      return {
        startDate: utcDate(year, 6, 1),
        endDate: utcDate(year, 7, 31),
      };
  }
};

const landSizeToHectares = (size: number, unit: LandUnit) => {
  if (unit === "ACRE") return size * 0.404686;
  if (unit === "SQUARE_METER") return size * 0.0001;
  return size;
};

const assertFarmOwnership = async (farmId: string, farmerId: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: {
      id: true,
      farmerId: true,
      landSize: true,
      landUnit: true,
      status: true,
    },
  });

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to add crops to this farm", 403);
  }

  if (farm.status === "INACTIVE") {
    throw new APIError("Cannot add crops to an inactive farm", 400);
  }

  return farm;
};

const assertCropAreaFitsFarm = (
  estimatedArea: number | undefined,
  farm: Awaited<ReturnType<typeof assertFarmOwnership>>
) => {
  if (estimatedArea == null) return;

  const farmAreaHa = landSizeToHectares(farm.landSize, farm.landUnit);
  if (estimatedArea > farmAreaHa) {
    throw new APIError(
      "Estimated crop area cannot be greater than the farm land size",
      400
    );
  }
};

const assertCropDatesFitSeason = (
  season: { startDate: Date; endDate: Date },
  plantingDate: Date,
  expectedHarvestDate?: Date | null,
  actualHarvestDate?: Date | null
) => {
  if (plantingDate < season.startDate || plantingDate > season.endDate) {
    throw new APIError("Planting date must fall within the selected season", 400);
  }

  const latestHarvestDate = addDays(season.endDate, HARVEST_GRACE_DAYS);

  for (const [field, date] of [
    ["expected harvest date", expectedHarvestDate],
    ["actual harvest date", actualHarvestDate],
  ] as const) {
    if (!date) continue;

    if (date < plantingDate) {
      throw new APIError(`${field} cannot be before planting date`, 400);
    }

    if (date > latestHarvestDate) {
      throw new APIError(
        `${field} must be within the season or ${HARVEST_GRACE_DAYS}-day harvest grace period`,
        400
      );
    }
  }
};

const assertNoDuplicateActiveCrop = async (
  farmId: string,
  seasonId: string,
  cropName: string,
  excludeCropId?: string
) => {
  const existing = await prisma.crop.findFirst({
    where: {
      farmId,
      seasonId,
      cropName: { equals: cropName, mode: "insensitive" },
      status: { in: ACTIVE_CROP_STATUSES },
      ...(excludeCropId && { id: { not: excludeCropId } }),
    },
    select: { id: true },
  });

  if (existing) {
    throw new APIError(
      "This farm already has an active record for the same crop in this season",
      409
    );
  }
};

const ALLOWED_STATUS_TRANSITIONS: Record<CropStatus, CropStatus[]> = {
  PLANNED: ["PLANTED", "GROWING", "FAILED"],
  PLANTED: ["GROWING", "HARVESTED", "FAILED"],
  GROWING: ["HARVESTED", "FAILED"],
  HARVESTED: [],
  FAILED: [],
};

const assertCropStatusTransition = (
  currentStatus: CropStatus,
  nextStatus: CropStatus | undefined,
  actualHarvestDate: Date | null | undefined
) => {
  if (!nextStatus || nextStatus === currentStatus) return;

  if (!ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new APIError(
      `Cannot change crop status from ${currentStatus} to ${nextStatus}`,
      400
    );
  }

  if (nextStatus === "HARVESTED" && !actualHarvestDate) {
    throw new APIError("Actual harvest date is required when marking a crop as harvested", 400);
  }
};

/* ─────────────────────────────────────────
   FARMING SEASON SERVICES
───────────────────────────────────────── */

export const createSeasonService = async (
  input: CreateSeasonInput,
  context: RequestContext = {}
) => {
  const name = normalizeRwandaSeasonName(input.name);
  const defaultWindow = getRwandaSeasonWindow(name, input.year);

  if (input.startDate && !isSameUtcDay(input.startDate, defaultWindow.startDate)) {
    throw new APIError(
      `${name} ${input.year} must start on ${defaultWindow.startDate.toISOString().slice(0, 10)}`,
      400
    );
  }

  if (input.endDate && !isSameUtcDay(input.endDate, defaultWindow.endDate)) {
    throw new APIError(
      `${name} ${input.year} must end on ${defaultWindow.endDate.toISOString().slice(0, 10)}`,
      400
    );
  }

  const existing = await prisma.farmingSeason.findUnique({
    where: { name_year: { name, year: input.year } },
    select: { id: true },
  });

  if (existing) {
    throw new APIError(
      `A season named "${name}" for year ${input.year} already exists`,
      409
    );
  }

  const season = await prisma.farmingSeason.create({
    data: {
      name,
      year: input.year,
      startDate: defaultWindow.startDate,
      endDate: defaultWindow.endDate,
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

  const farm = await assertFarmOwnership(input.farmId, farmerId);
  assertCropAreaFitsFarm(input.estimatedArea, farm);

  const season = await prisma.farmingSeason.findUnique({
    where: { id: input.seasonId },
    select: { id: true, startDate: true, endDate: true },
  });

  if (!season) {
    throw new APIError("Farming season not found", 404);
  }

  assertCropDatesFitSeason(
    season,
    input.plantingDate,
    input.expectedHarvestDate
  );

  await assertNoDuplicateActiveCrop(
    input.farmId,
    input.seasonId,
    input.cropName
  );

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

  await triggerCreditScoreRecalculation(farmerId);

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
    select: {
      id: true,
      farmId: true,
      seasonId: true,
      cropName: true,
      plantingDate: true,
      expectedHarvestDate: true,
      actualHarvestDate: true,
      estimatedArea: true,
      status: true,
      farm: {
        select: {
          farmerId: true,
          landSize: true,
          landUnit: true,
          status: true,
        },
      },
      season: {
        select: {
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!crop) {
    throw new APIError("Crop not found", 404);
  }

  if (crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this crop", 403);
  }

  if (crop.farm.status === "INACTIVE") {
    throw new APIError("Cannot update crops on an inactive farm", 400);
  }

  const nextPlantingDate = input.plantingDate ?? crop.plantingDate;
  const nextExpectedHarvestDate =
    input.expectedHarvestDate ?? crop.expectedHarvestDate;
  const nextActualHarvestDate =
    input.actualHarvestDate ?? crop.actualHarvestDate;
  const nextEstimatedArea = input.estimatedArea ?? crop.estimatedArea ?? undefined;
  const nextCropName = input.cropName ?? crop.cropName;

  assertCropAreaFitsFarm(nextEstimatedArea, {
    ...crop.farm,
    id: crop.farmId,
    farmerId,
  });

  assertCropDatesFitSeason(
    crop.season,
    nextPlantingDate,
    nextExpectedHarvestDate,
    nextActualHarvestDate
  );

  assertCropStatusTransition(
    crop.status,
    input.status,
    nextActualHarvestDate
  );

  const nextStatus = input.status ?? crop.status;
  if (nextActualHarvestDate && nextStatus !== "HARVESTED") {
    throw new APIError(
      "Actual harvest date can only be recorded when crop status is HARVESTED",
      400
    );
  }

  if (
    input.cropName &&
    input.cropName.trim().toLowerCase() !== crop.cropName.trim().toLowerCase()
  ) {
    await assertNoDuplicateActiveCrop(
      crop.farmId,
      crop.seasonId,
      nextCropName,
      crop.id
    );
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

  await refreshFinancialSummaryForSeason(farmerId, crop.seasonId, context);
  await triggerCreditScoreRecalculation(farmerId);

  return updated;
};

export const getCropPerformanceHistoryService = async (
  userId: string,
  cropName: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const { skip = 0, limit = 20 } = options;

  const where: Prisma.CropWhereInput = {
    farm: { farmerId },
    cropName: { equals: cropName, mode: "insensitive" },
  };

  const [crops, total] = await Promise.all([
    prisma.crop.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { season: { year: "desc" } },
        { season: { startDate: "desc" } },
      ],
      select: {
        id: true,
        cropName: true,
        cropType: true,
        plantingDate: true,
        expectedHarvestDate: true,
        actualHarvestDate: true,
        estimatedArea: true,
        status: true,
        notes: true,
        farm: { select: { id: true, name: true, district: true } },
        season: { select: { id: true, name: true, year: true } },
        yieldRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            actualYield: true,
            expectedYield: true,
            unit: true,
            qualityGrade: true,
            verificationStatus: true,
            verifiedActualYield: true,
            verifiedUnit: true,
          },
        },
        inputCosts: { select: { totalCost: true } },
        _count: { select: { inputCosts: true } },
      },
    }),
    prisma.crop.count({ where }),
  ]);

  const history = crops.map((crop) => {
    const yieldRecord = crop.yieldRecords[0] ?? null;
    const inputCostTotal = roundNumber(
      crop.inputCosts.reduce((sum, c) => sum + c.totalCost, 0)
    );

    return {
      cropId: crop.id,
      cropName: crop.cropName,
      cropType: crop.cropType,
      farm: crop.farm,
      season: crop.season,
      plantingDate: crop.plantingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      actualHarvestDate: crop.actualHarvestDate,
      estimatedArea: crop.estimatedArea,
      status: crop.status,
      notes: crop.notes,
      yield: yieldRecord
        ? {
            actualYield: yieldRecord.verifiedActualYield ?? yieldRecord.actualYield,
            expectedYield: yieldRecord.expectedYield,
            unit: yieldRecord.verifiedUnit ?? yieldRecord.unit,
            qualityGrade: yieldRecord.qualityGrade,
            verificationStatus: yieldRecord.verificationStatus,
          }
        : null,
      inputCostTotal,
      inputCostCount: crop._count.inputCosts,
    };
  });

  const harvestedHistory = history.filter(
    (c) => c.status === "HARVESTED" && c.yield !== null
  );
  const totalActualYield = roundNumber(
    harvestedHistory.reduce((sum, c) => sum + (c.yield?.actualYield ?? 0), 0)
  );

  return {
    cropName,
    seasonsPlanted: total,
    harvestedCount: harvestedHistory.length,
    totalActualYield,
    averageYieldPerSeason:
      harvestedHistory.length > 0
        ? roundNumber(totalActualYield / harvestedHistory.length)
        : 0,
    history,
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

export const deleteCropService = async (
  cropId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  let crop:
    | {
        id: string;
        seasonId: string;
        farm: { farmerId: string };
        _count: {
          yieldRecords: number;
          inputCosts: number;
          farmExpenses: number;
        };
      }
    | null = null;

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);

    crop = await prisma.crop.findUnique({
      where: { id: cropId },
      select: {
        id: true,
        seasonId: true,
        farm: { select: { farmerId: true } },
        _count: {
          select: {
            yieldRecords: true,
            inputCosts: true,
            farmExpenses: true,
          },
        },
      },
    });

    if (!crop) throw new APIError("Crop not found", 404);

    if (crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this crop", 403);
    }
  } else {
    crop = await prisma.crop.findUnique({
      where: { id: cropId },
      select: {
        id: true,
        seasonId: true,
        farm: { select: { farmerId: true } },
        _count: {
          select: {
            yieldRecords: true,
            inputCosts: true,
            farmExpenses: true,
          },
        },
      },
    });
    if (!crop) throw new APIError("Crop not found", 404);
  }

  if (!crop) throw new APIError("Crop not found", 404);

  const relatedRecords =
    crop._count.yieldRecords + crop._count.inputCosts + crop._count.farmExpenses;
  if (relatedRecords > 0) {
    throw new APIError(
      "Cannot delete a crop with yield, input cost, or expense history. Mark it as FAILED instead.",
      400
    );
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

  await refreshFinancialSummaryForSeason(
    crop.farm.farmerId,
    crop.seasonId,
    context
  );
  await triggerCreditScoreRecalculation(crop.farm.farmerId);

  return { message: "Crop deleted successfully." };
};
