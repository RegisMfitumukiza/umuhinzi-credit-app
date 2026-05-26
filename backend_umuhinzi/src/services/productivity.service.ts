import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateYieldRecordInput,
  UpdateYieldRecordInput,
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
  createdAt: true,
  updatedAt: true,
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

const assertCropOwnership = async (cropId: string, farmerId: string) => {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: { id: true, farm: { select: { farmerId: true } } },
  });

  if (!crop) throw new APIError("Crop not found", 404);

  if (crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to add records to this crop", 403);
  }
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
  await assertCropOwnership(input.cropId, farmerId);

  const record = await prisma.yieldRecord.create({
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
    select: { id: true, crop: { select: { farm: { select: { farmerId: true } } } } },
  });

  if (!existing) throw new APIError("Yield record not found", 404);

  if (existing.crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this yield record", 403);
  }

  const updated = await prisma.yieldRecord.update({
    where: { id: recordId },
    data: {
      expectedYield: input.expectedYield,
      actualYield: input.actualYield,
      unit: input.unit,
      harvestDate: input.harvestDate,
      qualityGrade: input.qualityGrade,
      notes: input.notes,
    },
    select: safeYieldRecordSelect,
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

  return updated;
};

export const deleteYieldRecordService = async (
  recordId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    const record = await prisma.yieldRecord.findUnique({
      where: { id: recordId },
      select: { id: true, crop: { select: { farm: { select: { farmerId: true } } } } },
    });
    if (!record) throw new APIError("Yield record not found", 404);
    if (record.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this yield record", 403);
    }
  } else {
    const record = await prisma.yieldRecord.findUnique({
      where: { id: recordId },
      select: { id: true },
    });
    if (!record) throw new APIError("Yield record not found", 404);
  }

  await prisma.yieldRecord.delete({ where: { id: recordId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "CROP",
    resourceId: recordId,
    description: "Yield record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

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
  await assertCropOwnership(input.cropId, farmerId);

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
    select: { id: true, crop: { select: { farm: { select: { farmerId: true } } } } },
  });

  if (!existing) throw new APIError("Input cost record not found", 404);

  if (existing.crop.farm.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this input cost record", 403);
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

  return updated;
};

export const deleteInputCostService = async (
  recordId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    const record = await prisma.inputCost.findUnique({
      where: { id: recordId },
      select: { id: true, crop: { select: { farm: { select: { farmerId: true } } } } },
    });
    if (!record) throw new APIError("Input cost record not found", 404);
    if (record.crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this input cost record", 403);
    }
  } else {
    const record = await prisma.inputCost.findUnique({
      where: { id: recordId },
      select: { id: true },
    });
    if (!record) throw new APIError("Input cost record not found", 404);
  }

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
