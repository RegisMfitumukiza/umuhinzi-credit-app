import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateFarmInput,
  UpdateFarmInput,
  UpdateFarmStatusInput,
  VerifyFarmLocationInput,
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
  locationSource: true,
  locationAccuracyMeters: true,
  locationCapturedAt: true,
  locationVerificationStatus: true,
  locationVerifiedAt: true,
  locationVerifiedById: true,
  locationVerificationNote: true,
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
  locationSource: true,
  locationAccuracyMeters: true,
  locationCapturedAt: true,
  locationVerificationStatus: true,
  locationVerifiedAt: true,
  locationVerifiedById: true,
  locationVerificationNote: true,
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
    select: { id: true, status: true },
  });

  if (!farmer) {
    throw new APIError(
      "Farmer profile not found. Please create your farmer profile first.",
      404
    );
  }

  if (farmer.status === "SUSPENDED") {
    throw new APIError("Suspended farmers cannot manage farm records.", 403);
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

const resolveCooperativeManager = async (userId: string) => {
  const manager = await prisma.cooperativeManager.findUnique({
    where: { userId },
    select: { cooperativeId: true },
  });

  if (!manager) throw new APIError("Cooperative manager profile not found.", 404);
  return manager;
};

const assertUniqueFarmName = async (
  farmerId: string,
  name: string,
  ignoreFarmId?: string
) => {
  const existing = await prisma.farm.findFirst({
    where: {
      farmerId,
      name: { equals: name, mode: "insensitive" },
      status: { not: "INACTIVE" },
      ...(ignoreFarmId && { id: { not: ignoreFarmId } }),
    },
    select: { id: true },
  });

  if (existing) {
    throw new APIError("A farm with this name already exists for this farmer.", 409);
  }
};

const requiresFarmReview = (input: UpdateFarmInput) =>
  [
    "landSize",
    "landUnit",
    "ownershipType",
    "province",
    "district",
    "sector",
    "cell",
    "village",
    "latitude",
    "longitude",
    "locationSource",
    "locationAccuracyMeters",
  ].some((field) => field in input);

const hasCoordinateInput = (input: CreateFarmInput | UpdateFarmInput) =>
  input.latitude !== undefined && input.longitude !== undefined;

const hasLocationChange = (input: UpdateFarmInput) =>
  [
    "province",
    "district",
    "sector",
    "cell",
    "village",
    "latitude",
    "longitude",
    "locationSource",
    "locationAccuracyMeters",
  ].some((field) => field in input);

const getCreateLocationData = (input: CreateFarmInput) => {
  const hasCoordinates = hasCoordinateInput(input);

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    locationSource: hasCoordinates
      ? input.locationSource ?? "GPS_BROWSER"
      : "ADDRESS_ONLY",
    locationAccuracyMeters: hasCoordinates ? input.locationAccuracyMeters : undefined,
    locationCapturedAt: hasCoordinates ? new Date() : undefined,
    locationVerificationStatus: hasCoordinates ? "PENDING" : "UNVERIFIED",
  } satisfies Partial<Prisma.FarmUncheckedCreateInput>;
};

const getUpdateLocationData = (
  input: UpdateFarmInput,
  existing: { latitude: number | null; longitude: number | null }
) => {
  if (!hasLocationChange(input)) return {};

  const clearingToAddressOnly = input.locationSource === "ADDRESS_ONLY";
  const nextLatitude = clearingToAddressOnly
    ? null
    : input.latitude ?? existing.latitude;
  const nextLongitude = clearingToAddressOnly
    ? null
    : input.longitude ?? existing.longitude;
  const hasCoordinates = nextLatitude !== null && nextLongitude !== null;

  return {
    latitude: clearingToAddressOnly ? null : input.latitude,
    longitude: clearingToAddressOnly ? null : input.longitude,
    locationSource: clearingToAddressOnly
      ? "ADDRESS_ONLY"
      : input.locationSource ?? (hasCoordinateInput(input) ? "GPS_BROWSER" : undefined),
    locationAccuracyMeters: clearingToAddressOnly ? null : input.locationAccuracyMeters,
    locationCapturedAt: hasCoordinateInput(input) ? new Date() : undefined,
    locationVerificationStatus: hasCoordinates ? "PENDING" : "UNVERIFIED",
    locationVerifiedAt: null,
    locationVerifiedBy: { disconnect: true },
    locationVerificationNote: null,
  } satisfies Prisma.FarmUpdateInput;
};

/* ─── create ─── */

export const createFarmService = async (
  userId: string,
  input: CreateFarmInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  await assertUniqueFarmName(farmerId, input.name);

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
      ...getCreateLocationData(input),
      status: "UNDER_REVIEW",
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

  await triggerCreditScoreRecalculation(farmerId);

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

  const existing = await prisma.farm.findUnique({
    where: { id: farmId },
    select: {
      id: true,
      farmerId: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!existing) throw new APIError("Farm not found", 404);
  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to access this farm", 403);
  }

  if (input.name) {
    await assertUniqueFarmName(farmerId, input.name, farmId);
  }

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
      ...getUpdateLocationData(input, existing),
      ...(requiresFarmReview(input) && { status: "UNDER_REVIEW" as const }),
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

  await triggerCreditScoreRecalculation(farmerId);

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
    select: { id: true, farmerId: true, status: true },
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

  await triggerCreditScoreRecalculation(existing.farmerId);

  return updated;
};

/* ─── delete farm ─── */

export const verifyFarmLocationService = async (
  farmId: string,
  userId: string,
  userRole: string,
  input: VerifyFarmLocationInput,
  context: RequestContext = {}
) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: {
      id: true,
      farmerId: true,
      latitude: true,
      longitude: true,
      district: true,
      sector: true,
      cell: true,
      village: true,
      farmer: {
        select: {
          cooperativeId: true,
          cooperativeMembership: {
            select: {
              cooperativeId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!farm) throw new APIError("Farm not found", 404);

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManager(userId);
    const activeMembership = farm.farmer.cooperativeMembership;

    if (
      farm.farmer.cooperativeId !== manager.cooperativeId &&
      !(
        activeMembership?.cooperativeId === manager.cooperativeId &&
        activeMembership.status === "ACTIVE"
      )
    ) {
      throw new APIError("Not authorized to verify this farm location.", 403);
    }
  } else if (userRole !== "ADMIN") {
    throw new APIError("Not authorized to verify farm locations.", 403);
  }

  const hasCoordinates = farm.latitude !== null && farm.longitude !== null;
  const hasDetailedAddress = Boolean(farm.sector || farm.cell || farm.village);

  if (input.status === "VERIFIED" && !hasCoordinates && !hasDetailedAddress) {
    throw new APIError(
      "Farm requires either GPS coordinates or detailed address fields before verification.",
      400
    );
  }

  const verifierSource =
    userRole === "COOPERATIVE_MANAGER" ? "COOPERATIVE_MANAGER" : "ADMIN";

  const updated = await prisma.farm.update({
    where: { id: farmId },
    data: {
      locationVerificationStatus: input.status,
      locationVerifiedAt: input.status === "VERIFIED" ? new Date() : null,
      locationVerifiedBy: { connect: { id: userId } },
      locationVerificationNote: input.note,
      ...(input.status === "VERIFIED" && {
        locationSource: hasCoordinates ? verifierSource : "ADDRESS_ONLY",
        status: "ACTIVE" as const,
      }),
      ...(input.status === "REJECTED" && {
        status: "UNDER_REVIEW" as const,
      }),
    },
    select: safeFarmSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "FARM",
    resourceId: farmId,
    description: `Farm location ${input.status.toLowerCase()}`,
    metadata: {
      farmerId: farm.farmerId,
      status: input.status,
      verifiedByRole: userRole,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farm.farmerId);

  return updated;
};

export const deleteFarmService = async (
  farmId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  let farmerId: string;

  if (!isAdmin) {
    farmerId = await resolveFarmerIdFromUser(userId);
    await assertFarmOwnership(farmId, farmerId);
  } else {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true, farmerId: true },
    });
    if (!farm) throw new APIError("Farm not found", 404);
    farmerId = farm.farmerId;
  }

  const farmUsage = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { _count: { select: { crops: true } } },
  });

  if (!farmUsage) throw new APIError("Farm not found", 404);

  if (farmUsage._count.crops > 0) {
    await prisma.farm.update({
      where: { id: farmId },
      data: { status: "INACTIVE" },
    });
  } else {
    await prisma.farm.delete({ where: { id: farmId } });
  }

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARM",
    resourceId: farmId,
    description:
      farmUsage._count.crops > 0
        ? "Farm deactivated because it has crop history"
        : "Farm deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return {
    message:
      farmUsage._count.crops > 0
        ? "Farm has existing crop history, so it was deactivated instead of deleted."
        : "Farm deleted successfully.",
  };
};
