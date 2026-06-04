import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";
import { refreshFinancialSummaryForCrop } from "./finance.service.js";

import type { Prisma, Role } from "../generated/prisma/client.js";
import type {
  CreateYieldRecordInput,
  UpdateYieldRecordInput,
  VerifyYieldRecordInput,
  CreateInputCostInput,
  UpdateInputCostInput,
  CreateProductivityRecordInput,
  UpdateProductivityRecordInput,
} from "../validators/productivity.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── selects ─── */

const safeYieldRecordSelect = {
  id: true,
  cropId: true,
  expectedYield: true,
  actualYield: true,
  unit: true,
  harvestDate: true,
  qualityGrade: true,
  notes: true,
  verificationStatus: true,
  verificationMethod: true,
  evidenceReference: true,
  verifiedActualYield: true,
  verifiedUnit: true,
  verificationNote: true,
  verificationRiskScore: true,
  verificationRiskNote: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
  verifiedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
  crop: {
    select: {
      id: true,
      cropName: true,
      cropType: true,
      farm: {
        select: {
          id: true,
          name: true,
          farmerId: true,
        },
      },
    },
  },
} satisfies Prisma.YieldRecordSelect;

const safeInputCostSelect = {
  id: true,
  cropId: true,
  type: true,
  name: true,
  description: true,
  quantity: true,
  unit: true,
  unitCost: true,
  totalCost: true,
  dateUsed: true,
  createdAt: true,
  updatedAt: true,
  crop: {
    select: {
      id: true,
      cropName: true,
      farm: {
        select: {
          id: true,
          name: true,
          farmerId: true,
        },
      },
    },
  },
} satisfies Prisma.InputCostSelect;

const safeProductivityRecordSelect = {
  id: true,
  farmerId: true,
  seasonId: true,
  totalExpectedYield: true,
  totalActualYield: true,
  unit: true,
  productivityRate: true,
  notes: true,
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
  season: {
    select: {
      id: true,
      name: true,
      year: true,
    },
  },
} satisfies Prisma.ProductivityRecordSelect;

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

const normalizeUnit = (unit: string) => {
  const value = unit.trim().toLowerCase();
  const aliases: Record<string, string> = {
    kgs: "kg",
    kilo: "kg",
    kilos: "kg",
    kilogram: "kg",
    kilograms: "kg",
    gram: "g",
    grams: "g",
    tonne: "ton",
    tonnes: "ton",
    tons: "ton",
  };

  return aliases[value] ?? value;
};

const roundNumber = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const assertCropOwnership = async (cropId: string, farmerId: string) => {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: {
      id: true,
      status: true,
      plantingDate: true,
      actualHarvestDate: true,
      seasonId: true,
      farm: { select: { farmerId: true } },
      season: {
        select: {
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!crop) throw new APIError("Crop not found", 404);

  if (crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to add records to this crop", 403);
  }

  return crop;
};

const assertHarvestDateFitsCrop = (
  crop: Awaited<ReturnType<typeof assertCropOwnership>>,
  harvestDate: Date
) => {
  if (crop.status === "FAILED") {
    throw new APIError("Cannot record yield for a failed crop", 400);
  }

  if (harvestDate < crop.plantingDate) {
    throw new APIError("Harvest date cannot be before planting date", 400);
  }

  const latestAllowedHarvestDate = addDays(crop.season.endDate, 30);
  if (harvestDate > latestAllowedHarvestDate) {
    throw new APIError(
      "Harvest date must be within the season or the 30-day harvest grace period",
      400
    );
  }
};

const assertInputCostDateFitsCrop = (
  crop: Awaited<ReturnType<typeof assertCropOwnership>>,
  dateUsed: Date,
  options: { allowClosedCrop?: boolean } = {}
) => {
  if (
    !options.allowClosedCrop &&
    (crop.status === "HARVESTED" || crop.status === "FAILED")
  ) {
    throw new APIError(
      "Cannot add new input costs after a crop is harvested or failed",
      400
    );
  }

  const earliestAllowedDate = addDays(crop.season.startDate, -30);
  if (dateUsed < earliestAllowedDate || dateUsed > crop.season.endDate) {
    throw new APIError(
      "Input cost date must be within the season preparation window",
      400
    );
  }
};

const getUpperYieldLimitKgPerHa = (cropName: string) => {
  const name = cropName.trim().toLowerCase();

  if (name.includes("maize") || name.includes("corn")) return 8000;
  if (name.includes("bean")) return 3500;
  if (name.includes("rice")) return 9000;
  if (name.includes("potato")) return 30000;
  if (name.includes("cassava")) return 30000;
  if (name.includes("banana")) return 40000;
  if (name.includes("coffee")) return 3000;
  if (name.includes("tea")) return 4000;
  if (name.includes("sorghum")) return 5000;
  if (name.includes("wheat")) return 6000;

  return null;
};

const assessYieldVerificationRisk = (input: {
  cropName: string;
  estimatedArea: number | null;
  expectedYield: number | null;
  verifiedActualYield: number;
  verifiedUnit: string;
}) => {
  let score = 0;
  const notes: string[] = [];

  if (
    input.expectedYield != null &&
    input.expectedYield > 0 &&
    input.verifiedActualYield > input.expectedYield * 1.5
  ) {
    score += 35;
    notes.push("Verified yield is more than 150% of expected yield.");
  }

  const normalizedUnit = normalizeUnit(input.verifiedUnit);
  const upperLimitKgPerHa = getUpperYieldLimitKgPerHa(input.cropName);
  if (
    normalizedUnit === "kg" &&
    upperLimitKgPerHa != null &&
    input.estimatedArea != null &&
    input.estimatedArea > 0
  ) {
    const yieldPerHa = input.verifiedActualYield / input.estimatedArea;
    if (yieldPerHa > upperLimitKgPerHa) {
      score += 45;
      notes.push(
        `Yield per hectare (${roundNumber(yieldPerHa)} kg/ha) is above the normal upper range for ${input.cropName}.`
      );
    }
  }

  return {
    score: Math.min(score, 100),
    note: notes.length > 0 ? notes.join(" ") : null,
  };
};

const changesYieldMeasurement = (input: UpdateYieldRecordInput) =>
  ["expectedYield", "actualYield", "unit", "harvestDate", "qualityGrade"].some(
    (field) => Object.prototype.hasOwnProperty.call(input, field)
  );

const assertYieldVerificationAuthority = async (
  userId: string,
  userRole: Role,
  farmerId: string
) => {
  if (userRole === "ADMIN") return;

  if (userRole !== "COOPERATIVE_MANAGER") {
    throw new APIError("You are not allowed to verify yield records", 403);
  }

  const manager = await prisma.cooperativeManager.findUnique({
    where: { userId },
    select: {
      cooperativeId: true,
      cooperative: { select: { status: true } },
    },
  });

  if (!manager || manager.cooperative.status !== "ACTIVE") {
    throw new APIError("Active cooperative manager profile required", 403);
  }

  const membership = await prisma.cooperativeMember.findUnique({
    where: { farmerId },
    select: { cooperativeId: true, status: true },
  });

  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.cooperativeId !== manager.cooperativeId
  ) {
    throw new APIError(
      "You can only verify harvests for active farmers in your cooperative",
      403
    );
  }
};

const refreshProductivityRecordForSeason = async (
  farmerId: string,
  seasonId: string,
  context: RequestContext = {}
) => {
  const yieldRecords = await prisma.yieldRecord.findMany({
    where: {
      verificationStatus: "VERIFIED",
      crop: { seasonId, farm: { farmerId } },
    },
    select: {
      expectedYield: true,
      actualYield: true,
      verifiedActualYield: true,
      unit: true,
      verifiedUnit: true,
    },
  });

  const existing = await prisma.productivityRecord.findUnique({
    where: { farmerId_seasonId: { farmerId, seasonId } },
    select: { id: true },
  });

  if (yieldRecords.length === 0) {
    if (existing) {
      await prisma.productivityRecord.delete({ where: { id: existing.id } });

      await writeAuditLog({
        actorId: context.actorId,
        action: "DELETE",
        resource: "FARMER",
        resourceId: existing.id,
        description: "Productivity record automatically removed after yield records were deleted",
        metadata: { farmerId, seasonId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      await triggerCreditScoreRecalculation(farmerId);
    }

    return null;
  }

  const unitsByCount = new Map<string, { unit: string; count: number }>();
  for (const record of yieldRecords) {
    const unitKey = normalizeUnit(record.verifiedUnit ?? record.unit);
    const current = unitsByCount.get(unitKey);
    unitsByCount.set(unitKey, {
      unit: current?.unit ?? unitKey,
      count: (current?.count ?? 0) + 1,
    });
  }

  const primaryUnit = [...unitsByCount.values()].sort(
    (a, b) => b.count - a.count
  )[0].unit;
  const compatibleRecords = yieldRecords.filter(
    (record) => normalizeUnit(record.verifiedUnit ?? record.unit) === primaryUnit
  );
  const excludedCount = yieldRecords.length - compatibleRecords.length;

  const totalActualYield = roundNumber(
    compatibleRecords.reduce(
      (sum, record) => sum + (record.verifiedActualYield ?? record.actualYield),
      0
    )
  );
  const totalExpectedYield = roundNumber(
    compatibleRecords.reduce(
      (sum, record) => sum + (record.expectedYield ?? 0),
      0
    )
  );
  const productivityRate =
    totalExpectedYield > 0
      ? roundNumber((totalActualYield / totalExpectedYield) * 100)
      : 0;

  const notes = [
    `Auto-calculated from ${compatibleRecords.length} yield record(s).`,
    totalExpectedYield === 0
      ? "Expected yield was not recorded, so productivity rate is 0 until expected yield is provided."
      : undefined,
    excludedCount > 0
      ? `${excludedCount} yield record(s) were excluded because their units differ from ${primaryUnit}.`
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const record = existing
    ? await prisma.productivityRecord.update({
        where: { id: existing.id },
        data: {
          totalExpectedYield: totalExpectedYield > 0 ? totalExpectedYield : null,
          totalActualYield,
          unit: primaryUnit,
          productivityRate,
          notes,
        },
        select: safeProductivityRecordSelect,
      })
    : await prisma.productivityRecord.create({
        data: {
          farmerId,
          seasonId,
          totalExpectedYield: totalExpectedYield > 0 ? totalExpectedYield : null,
          totalActualYield,
          unit: primaryUnit,
          productivityRate,
          notes,
        },
        select: safeProductivityRecordSelect,
      });

  await writeAuditLog({
    actorId: context.actorId,
    action: existing ? "UPDATE" : "CREATE",
    resource: "FARMER",
    resourceId: record.id,
    description: existing
      ? "Productivity record automatically recalculated"
      : "Productivity record automatically created",
    metadata: { farmerId, seasonId, productivityRate },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return record;
};

/* ─────────────────────────────────────────
   YIELD RECORD SERVICES
───────────────────────────────────────── */

export const createYieldRecordService = async (
  userId: string,
  input: CreateYieldRecordInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const crop = await assertCropOwnership(input.cropId, farmerId);
  assertHarvestDateFitsCrop(crop, input.harvestDate);

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.yieldRecord.create({
      data: {
        cropId: input.cropId,
        expectedYield: input.expectedYield,
        actualYield: input.actualYield,
        unit: input.unit ?? "kg",
        harvestDate: input.harvestDate,
        qualityGrade: input.qualityGrade ?? "AVERAGE",
        notes: input.notes,
      },
      select: safeYieldRecordSelect,
    });

    await tx.crop.update({
      where: { id: input.cropId },
      data: {
        status: "HARVESTED",
        actualHarvestDate: input.harvestDate,
      },
    });

    return created;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "CROP",
    resourceId: record.id,
    description: "Yield record created",
    metadata: { cropId: input.cropId, actualYield: input.actualYield },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshProductivityRecordForSeason(farmerId, crop.seasonId, context);
  await refreshFinancialSummaryForCrop(input.cropId, context);

  return record;
};

export const getMyYieldRecordsService = async (
  userId: string,
  options: { skip?: number; limit?: number; cropId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10, cropId } = options;

  const where: Prisma.YieldRecordWhereInput = {
    crop: { farm: { farmerId } },
    ...(cropId && { cropId }),
  };

  const [records, total] = await Promise.all([
    prisma.yieldRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeYieldRecordSelect,
    }),
    prisma.yieldRecord.count({ where }),
  ]);

  return {
    yields: records,
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

export const getAllYieldRecordsService = async (
  options: { skip?: number; limit?: number; where?: Prisma.YieldRecordWhereInput } = {}
) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [records, total] = await Promise.all([
    prisma.yieldRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeYieldRecordSelect,
    }),
    prisma.yieldRecord.count({ where }),
  ]);

  return {
    yields: records,
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

export const getYieldRecordByIdService = async (
  recordId: string,
  userId?: string,
  isAdmin = false
) => {
  const record = await prisma.yieldRecord.findUnique({
    where: { id: recordId },
    select: safeYieldRecordSelect,
  });

  if (!record) throw new APIError("Yield record not found", 404);

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (record.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this yield record", 403);
    }
  }

  return record;
};

export const updateYieldRecordService = async (
  recordId: string,
  userId: string,
  input: UpdateYieldRecordInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.yieldRecord.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      cropId: true,
      verificationStatus: true,
      crop: {
        select: {
          id: true,
          status: true,
          plantingDate: true,
          actualHarvestDate: true,
          seasonId: true,
          farm: { select: { farmerId: true } },
          season: { select: { startDate: true, endDate: true } },
        },
      },
    },
  });

  if (!existing) throw new APIError("Yield record not found", 404);

  if (existing.crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this yield record", 403);
  }

  const measurementChanged = changesYieldMeasurement(input);
  if (existing.verificationStatus === "VERIFIED" && measurementChanged) {
    throw new APIError(
      "Verified yield measurements cannot be edited. Ask an admin or cooperative manager to re-verify the harvest.",
      400
    );
  }

  if (input.harvestDate) {
    assertHarvestDateFitsCrop(existing.crop, input.harvestDate);
  }

  const resetRejectedVerification =
    existing.verificationStatus === "REJECTED" && measurementChanged;

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.yieldRecord.update({
      where: { id: recordId },
      data: {
        expectedYield: input.expectedYield,
        actualYield: input.actualYield,
        unit: input.unit,
        harvestDate: input.harvestDate,
        qualityGrade: input.qualityGrade,
        notes: input.notes,
        ...(resetRejectedVerification && {
          verificationStatus: "PENDING",
          verificationMethod: null,
          evidenceReference: null,
          verifiedActualYield: null,
          verifiedUnit: null,
          verificationNote: null,
          verificationRiskScore: 0,
          verificationRiskNote: null,
          verifiedAt: null,
          verifiedById: null,
        }),
      },
      select: safeYieldRecordSelect,
    });

    if (input.harvestDate) {
      await tx.crop.update({
        where: { id: existing.cropId },
        data: {
          status: "HARVESTED",
          actualHarvestDate: input.harvestDate,
        },
      });
    }

    return record;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "CROP",
    resourceId: recordId,
    description: "Yield record updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshProductivityRecordForSeason(
    farmerId,
    existing.crop.seasonId,
    context
  );
  await refreshFinancialSummaryForCrop(existing.cropId, context);

  return updated;
};

export const verifyYieldRecordService = async (
  recordId: string,
  userId: string,
  userRole: Role,
  input: VerifyYieldRecordInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.yieldRecord.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      cropId: true,
      expectedYield: true,
      actualYield: true,
      unit: true,
      crop: {
        select: {
          cropName: true,
          estimatedArea: true,
          seasonId: true,
          farm: { select: { farmerId: true } },
        },
      },
    },
  });

  if (!existing) throw new APIError("Yield record not found", 404);

  await assertYieldVerificationAuthority(
    userId,
    userRole,
    existing.crop.farm.farmerId
  );

  const verifiedActualYield =
    input.status === "VERIFIED"
      ? input.verifiedActualYield ?? existing.actualYield
      : null;
  const verifiedUnit =
    input.status === "VERIFIED" ? input.verifiedUnit ?? existing.unit : null;

  const risk =
    input.status === "VERIFIED"
      ? assessYieldVerificationRisk({
          cropName: existing.crop.cropName,
          estimatedArea: existing.crop.estimatedArea,
          expectedYield: existing.expectedYield,
          verifiedActualYield: verifiedActualYield ?? existing.actualYield,
          verifiedUnit: verifiedUnit ?? existing.unit,
        })
      : { score: 0, note: null };

  if (
    input.status === "VERIFIED" &&
    risk.score >= 60 &&
    (input.verificationNote?.trim().length ?? 0) < 20
  ) {
    throw new APIError(
      "This harvest looks unusual. Add a detailed verification note before approving it.",
      400
    );
  }

  const updated = await prisma.yieldRecord.update({
    where: { id: recordId },
    data: {
      verificationStatus: input.status,
      verificationMethod:
        input.status === "VERIFIED" ? input.method ?? null : null,
      evidenceReference:
        input.status === "VERIFIED" ? input.evidenceReference ?? null : null,
      verifiedActualYield,
      verifiedUnit,
      verificationNote: input.verificationNote,
      verificationRiskScore: risk.score,
      verificationRiskNote: risk.note,
      verifiedAt: new Date(),
      verifiedById: userId,
    },
    select: safeYieldRecordSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "CROP",
    resourceId: recordId,
    description: `Yield record ${input.status.toLowerCase()}`,
    metadata: {
      status: input.status,
      method: input.method,
      cropId: existing.cropId,
      farmerId: existing.crop.farm.farmerId,
      verificationRiskScore: risk.score,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshProductivityRecordForSeason(
    existing.crop.farm.farmerId,
    existing.crop.seasonId,
    context
  );
  await refreshFinancialSummaryForCrop(existing.cropId, context);
  await triggerCreditScoreRecalculation(existing.crop.farm.farmerId);

  return updated;
};

export const deleteYieldRecordService = async (
  recordId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  let recordToDelete:
    | {
        id: string;
        cropId: string;
        verificationStatus: string;
        crop: {
          status: string;
          seasonId: string;
          farm: { farmerId: string };
        };
      }
    | null = null;

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    recordToDelete = await prisma.yieldRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        cropId: true,
        verificationStatus: true,
        crop: {
          select: {
            status: true,
            seasonId: true,
            farm: { select: { farmerId: true } },
          },
        },
      },
    });
    if (!recordToDelete) throw new APIError("Yield record not found", 404);
    if (recordToDelete.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this yield record", 403);
    }
  } else {
    recordToDelete = await prisma.yieldRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        cropId: true,
        verificationStatus: true,
        crop: {
          select: {
            status: true,
            seasonId: true,
            farm: { select: { farmerId: true } },
          },
        },
      },
    });
    if (!recordToDelete) throw new APIError("Yield record not found", 404);
  }

  if (!recordToDelete) throw new APIError("Yield record not found", 404);

  if (!isAdmin && recordToDelete.verificationStatus === "VERIFIED") {
    throw new APIError("Verified yield records cannot be deleted by farmers", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.yieldRecord.delete({ where: { id: recordId } });

    const latestYield = await tx.yieldRecord.findFirst({
      where: { cropId: recordToDelete!.cropId },
      orderBy: { harvestDate: "desc" },
      select: { harvestDate: true },
    });

    if (recordToDelete!.crop.status === "HARVESTED") {
      await tx.crop.update({
        where: { id: recordToDelete!.cropId },
        data: latestYield
          ? { status: "HARVESTED", actualHarvestDate: latestYield.harvestDate }
          : { status: "GROWING", actualHarvestDate: null },
      });
    }
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "CROP",
    resourceId: recordId,
    description: "Yield record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshProductivityRecordForSeason(
    recordToDelete.crop.farm.farmerId,
    recordToDelete.crop.seasonId,
    context
  );
  await refreshFinancialSummaryForCrop(recordToDelete.cropId, context);

  return { message: "Yield record deleted successfully." };
};

/* ─────────────────────────────────────────
   INPUT COST SERVICES
───────────────────────────────────────── */

export const createInputCostService = async (
  userId: string,
  input: CreateInputCostInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const crop = await assertCropOwnership(input.cropId, farmerId);
  assertInputCostDateFitsCrop(crop, input.dateUsed);

  const record = await prisma.inputCost.create({
    data: {
      cropId: input.cropId,
      type: input.type,
      name: input.name,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      unitCost: input.unitCost,
      totalCost: input.totalCost,
      dateUsed: input.dateUsed,
    },
    select: safeInputCostSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "CROP",
    resourceId: record.id,
    description: "Input cost record created",
    metadata: { cropId: input.cropId, type: input.type, totalCost: input.totalCost },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummaryForCrop(input.cropId, context);

  return record;
};

export const getMyInputCostsService = async (
  userId: string,
  options: { skip?: number; limit?: number; cropId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10, cropId } = options;

  const where: Prisma.InputCostWhereInput = {
    crop: { farm: { farmerId } },
    ...(cropId && { cropId }),
  };

  const [records, total] = await Promise.all([
    prisma.inputCost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeInputCostSelect,
    }),
    prisma.inputCost.count({ where }),
  ]);

  return {
    inputCosts: records,
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

export const getAllInputCostsService = async (
  options: { skip?: number; limit?: number; where?: Prisma.InputCostWhereInput } = {}
) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [records, total] = await Promise.all([
    prisma.inputCost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeInputCostSelect,
    }),
    prisma.inputCost.count({ where }),
  ]);

  return {
    inputCosts: records,
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

export const getInputCostByIdService = async (
  recordId: string,
  userId?: string,
  isAdmin = false
) => {
  const record = await prisma.inputCost.findUnique({
    where: { id: recordId },
    select: safeInputCostSelect,
  });

  if (!record) throw new APIError("Input cost record not found", 404);

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (record.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this input cost record", 403);
    }
  }

  return record;
};

export const updateInputCostService = async (
  recordId: string,
  userId: string,
  input: UpdateInputCostInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.inputCost.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      cropId: true,
      crop: {
        select: {
          id: true,
          status: true,
          plantingDate: true,
          actualHarvestDate: true,
          seasonId: true,
          farm: { select: { farmerId: true } },
          season: { select: { startDate: true, endDate: true } },
        },
      },
    },
  });

  if (!existing) throw new APIError("Input cost record not found", 404);

  if (existing.crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this input cost record", 403);
  }

  if (input.dateUsed) {
    assertInputCostDateFitsCrop(existing.crop, input.dateUsed, {
      allowClosedCrop: true,
    });
  }

  const updated = await prisma.inputCost.update({
    where: { id: recordId },
    data: {
      type: input.type,
      name: input.name,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      unitCost: input.unitCost,
      totalCost: input.totalCost,
      dateUsed: input.dateUsed,
    },
    select: safeInputCostSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "CROP",
    resourceId: recordId,
    description: "Input cost record updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummaryForCrop(existing.cropId, context);

  return updated;
};

export const deleteInputCostService = async (
  recordId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  let recordToDelete:
    | {
        id: string;
        cropId: string;
        crop: { farm: { farmerId: string } };
      }
    | null = null;

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    recordToDelete = await prisma.inputCost.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        cropId: true,
        crop: { select: { farm: { select: { farmerId: true } } } },
      },
    });
    if (!recordToDelete) throw new APIError("Input cost record not found", 404);
    if (recordToDelete.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this input cost record", 403);
    }
  } else {
    recordToDelete = await prisma.inputCost.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        cropId: true,
        crop: { select: { farm: { select: { farmerId: true } } } },
      },
    });
    if (!recordToDelete) throw new APIError("Input cost record not found", 404);
  }

  if (!recordToDelete) throw new APIError("Input cost record not found", 404);

  await prisma.inputCost.delete({ where: { id: recordId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "CROP",
    resourceId: recordId,
    description: "Input cost record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummaryForCrop(recordToDelete.cropId, context);

  return { message: "Input cost record deleted successfully." };
};

/* ─────────────────────────────────────────
   PRODUCTIVITY RECORD SERVICES
───────────────────────────────────────── */

export const createProductivityRecordService = async (
  userId: string,
  input: CreateProductivityRecordInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const season = await prisma.farmingSeason.findUnique({
    where: { id: input.seasonId },
    select: { id: true },
  });
  if (!season) throw new APIError("Farming season not found", 404);

  const existing = await prisma.productivityRecord.findUnique({
    where: { farmerId_seasonId: { farmerId, seasonId: input.seasonId } },
    select: { id: true },
  });
  if (existing) {
    throw new APIError(
      "A productivity record for this season already exists. Use update instead.",
      409
    );
  }

  const record = await prisma.productivityRecord.create({
    data: {
      farmerId,
      seasonId: input.seasonId,
      totalExpectedYield: input.totalExpectedYield,
      totalActualYield: input.totalActualYield,
      unit: input.unit ?? "kg",
      productivityRate: input.productivityRate,
      notes: input.notes,
    },
    select: safeProductivityRecordSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARMER",
    resourceId: record.id,
    description: "Productivity record created",
    metadata: { seasonId: input.seasonId, productivityRate: input.productivityRate },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return record;
};

export const getMyProductivityRecordsService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10 } = options;

  const where: Prisma.ProductivityRecordWhereInput = { farmerId };

  const [records, total] = await Promise.all([
    prisma.productivityRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeProductivityRecordSelect,
    }),
    prisma.productivityRecord.count({ where }),
  ]);

  return {
    productivityRecords: records,
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

export const getAllProductivityRecordsService = async (
  options: { skip?: number; limit?: number; where?: Prisma.ProductivityRecordWhereInput } = {}
) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [records, total] = await Promise.all([
    prisma.productivityRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeProductivityRecordSelect,
    }),
    prisma.productivityRecord.count({ where }),
  ]);

  return {
    productivityRecords: records,
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

export const getProductivityRecordByIdService = async (
  recordId: string,
  userId?: string,
  isAdmin = false
) => {
  const record = await prisma.productivityRecord.findUnique({
    where: { id: recordId },
    select: safeProductivityRecordSelect,
  });

  if (!record) throw new APIError("Productivity record not found", 404);

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (record.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this productivity record", 403);
    }
  }

  return record;
};

export const updateProductivityRecordService = async (
  recordId: string,
  userId: string,
  input: UpdateProductivityRecordInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.productivityRecord.findUnique({
    where: { id: recordId },
    select: { id: true, farmerId: true },
  });

  if (!existing) throw new APIError("Productivity record not found", 404);

  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this productivity record", 403);
  }

  const updated = await prisma.productivityRecord.update({
    where: { id: recordId },
    data: {
      totalExpectedYield: input.totalExpectedYield,
      totalActualYield: input.totalActualYield,
      unit: input.unit,
      productivityRate: input.productivityRate,
      notes: input.notes,
    },
    select: safeProductivityRecordSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: recordId,
    description: "Productivity record updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

export const deleteProductivityRecordService = async (
  recordId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    const record = await prisma.productivityRecord.findUnique({
      where: { id: recordId },
      select: { id: true, farmerId: true },
    });
    if (!record) throw new APIError("Productivity record not found", 404);
    if (record.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this productivity record", 403);
    }
  } else {
    const record = await prisma.productivityRecord.findUnique({
      where: { id: recordId },
      select: { id: true },
    });
    if (!record) throw new APIError("Productivity record not found", 404);
  }

  await prisma.productivityRecord.delete({ where: { id: recordId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARMER",
    resourceId: recordId,
    description: "Productivity record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Productivity record deleted successfully." };
};
