import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";
import { generateMarketPriceRecommendations } from "./recommendation.service.js";

import type { CashFlowStatus, Prisma } from "../generated/prisma/client.js";
import type {
  CreateFarmExpenseInput,
  UpdateFarmExpenseInput,
  CreateFinancialSummaryInput,
  UpdateFinancialSummaryInput,
  CreateMarketPriceInput,
  UpdateMarketPriceInput,
} from "../validators/finance.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── selects ─── */

const safeFarmExpenseSelect = {
  id: true,
  farmerId: true,
  cropId: true,
  type: true,
  amount: true,
  description: true,
  expenseDate: true,
  createdAt: true,
  updatedAt: true,
  crop: {
    select: {
      id: true,
      cropName: true,
    },
  },
} satisfies Prisma.FarmExpenseSelect;

const farmExpenseWithFarmerSelect = {
  id: true,
  farmerId: true,
  cropId: true,
  type: true,
  amount: true,
  description: true,
  expenseDate: true,
  createdAt: true,
  updatedAt: true,
  crop: {
    select: {
      id: true,
      cropName: true,
    },
  },
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
} satisfies Prisma.FarmExpenseSelect;

const safeFinancialSummarySelect = {
  id: true,
  farmerId: true,
  seasonId: true,
  totalIncome: true,
  totalExpenses: true,
  netProfit: true,
  cashFlowStatus: true,
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
} satisfies Prisma.FinancialSummarySelect;

const financialSummaryWithFarmerSelect = {
  id: true,
  farmerId: true,
  seasonId: true,
  totalIncome: true,
  totalExpenses: true,
  netProfit: true,
  cashFlowStatus: true,
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
} satisfies Prisma.FinancialSummarySelect;

const safeMarketPriceSelect = {
  id: true,
  cropName: true,
  marketLocation: true,
  pricePerUnit: true,
  unit: true,
  recordedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MarketPriceSelect;

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

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getCashFlowStatus = (netProfit: number): CashFlowStatus => {
  if (netProfit > 0) return "POSITIVE";
  if (netProfit < 0) return "NEGATIVE";
  return "NEUTRAL";
};

const normalizeLookupKey = (...parts: string[]) =>
  parts.map((part) => part.trim().toLowerCase()).join("::");

const normalizeUnitForPricing = (unit: string) => {
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

const normalizePriceKey = (cropName: string, unit: string) =>
  normalizeLookupKey(cropName, normalizeUnitForPricing(unit));

const calculateSeasonFinancials = async (farmerId: string, seasonId: string) => {
  const season = await prisma.farmingSeason.findUnique({
    where: { id: seasonId },
    select: { id: true, name: true, year: true, startDate: true, endDate: true },
  });

  if (!season) throw new APIError("Farming season not found", 404);

  const seasonCrops = await prisma.crop.findMany({
    where: { seasonId, farm: { farmerId } },
    select: { id: true, cropName: true },
  });

  const cropIds = seasonCrops.map((crop) => crop.id);

  const [
    yieldRecords,
    excludedYieldCount,
    inputCostTotals,
    farmExpenseTotals,
  ] = await Promise.all([
    cropIds.length > 0
      ? prisma.yieldRecord.findMany({
          where: {
            cropId: { in: cropIds },
            verificationStatus: "VERIFIED",
          },
          select: {
            actualYield: true,
            verifiedActualYield: true,
            unit: true,
            verifiedUnit: true,
            crop: { select: { cropName: true } },
          },
        })
      : Promise.resolve([]),
    cropIds.length > 0
      ? prisma.yieldRecord.count({
          where: {
            cropId: { in: cropIds },
            verificationStatus: { not: "VERIFIED" },
          },
        })
      : Promise.resolve(0),
    cropIds.length > 0
      ? prisma.inputCost.aggregate({
          where: { cropId: { in: cropIds } },
          _sum: { totalCost: true },
        })
      : Promise.resolve({ _sum: { totalCost: 0 } }),
    prisma.farmExpense.aggregate({
      where: {
        farmerId,
        OR: [
          ...(cropIds.length > 0 ? [{ cropId: { in: cropIds } }] : []),
          {
            cropId: null,
            expenseDate: {
              gte: season.startDate,
              lte: season.endDate,
            },
          },
        ],
      },
      _sum: { amount: true },
    }),
  ]);

  const cropNames = [
    ...new Set(yieldRecords.map((record) => record.crop.cropName)),
  ];

  const marketPrices =
    cropNames.length > 0
      ? await prisma.marketPrice.findMany({
          where: {
            OR: cropNames.map((cropName) => ({
              cropName: { equals: cropName, mode: "insensitive" },
            })),
          },
          orderBy: { recordedAt: "desc" },
          select: {
            cropName: true,
            unit: true,
            pricePerUnit: true,
            marketLocation: true,
            recordedAt: true,
          },
        })
      : [];

  const latestPriceByCropAndCompatibleUnit = new Map<
    string,
    (typeof marketPrices)[number]
  >();
  const cropNamesWithPrices = new Set<string>();

  for (const price of marketPrices) {
    cropNamesWithPrices.add(price.cropName.trim().toLowerCase());

    const key = normalizePriceKey(price.cropName, price.unit);
    if (!latestPriceByCropAndCompatibleUnit.has(key)) {
      latestPriceByCropAndCompatibleUnit.set(key, price);
    }
  }

  let totalIncome = 0;
  let missingPriceCount = 0;
  let incompatibleUnitPriceCount = 0;

  for (const record of yieldRecords) {
    const recordUnit = record.verifiedUnit ?? record.unit;
    const price = latestPriceByCropAndCompatibleUnit.get(
      normalizePriceKey(record.crop.cropName, recordUnit)
    );

    if (!price) {
      if (cropNamesWithPrices.has(record.crop.cropName.trim().toLowerCase())) {
        incompatibleUnitPriceCount += 1;
      } else {
        missingPriceCount += 1;
      }
      continue;
    }

    totalIncome += (record.verifiedActualYield ?? record.actualYield) * price.pricePerUnit;
  }

  const inputCosts = inputCostTotals._sum.totalCost ?? 0;
  const farmExpenses = farmExpenseTotals._sum.amount ?? 0;
  const totalExpenses = roundMoney(inputCosts + farmExpenses);
  const netProfit = roundMoney(totalIncome - totalExpenses);

  const notes = [
    `Auto-calculated for ${season.name} ${season.year} from ${yieldRecords.length} yield record(s), ${cropIds.length} crop(s), input costs, and farm expenses.`,
    missingPriceCount > 0
      ? `${missingPriceCount} yield record(s) were excluded because no matching market price was found.`
      : undefined,
    incompatibleUnitPriceCount > 0
      ? `${incompatibleUnitPriceCount} yield record(s) had market prices for the crop but no compatible unit, so they were excluded.`
      : undefined,
    excludedYieldCount > 0
      ? `${excludedYieldCount} pending or rejected yield record(s) were excluded until verified.`
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    totalIncome: roundMoney(totalIncome),
    totalExpenses,
    netProfit,
    cashFlowStatus: getCashFlowStatus(netProfit),
    notes,
  };
};

const hasFinancialActivityForSeason = async (
  farmerId: string,
  seasonId: string
) => {
  const season = await prisma.farmingSeason.findUnique({
    where: { id: seasonId },
    select: { id: true, startDate: true, endDate: true },
  });

  if (!season) throw new APIError("Farming season not found", 404);

  const seasonCrops = await prisma.crop.findMany({
    where: { seasonId, farm: { farmerId } },
    select: { id: true },
  });
  const cropIds = seasonCrops.map((crop) => crop.id);

  const [yieldCount, inputCostCount, farmExpenseCount] = await Promise.all([
    cropIds.length > 0
      ? prisma.yieldRecord.count({ where: { cropId: { in: cropIds } } })
      : Promise.resolve(0),
    cropIds.length > 0
      ? prisma.inputCost.count({ where: { cropId: { in: cropIds } } })
      : Promise.resolve(0),
    prisma.farmExpense.count({
      where: {
        farmerId,
        OR: [
          ...(cropIds.length > 0 ? [{ cropId: { in: cropIds } }] : []),
          {
            cropId: null,
            expenseDate: {
              gte: season.startDate,
              lte: season.endDate,
            },
          },
        ],
      },
    }),
  ]);

  return yieldCount + inputCostCount + farmExpenseCount > 0;
};

export const refreshFinancialSummaryForSeason = async (
  farmerId: string,
  seasonId: string,
  context: RequestContext = {}
) => {
  const existing = await prisma.financialSummary.findUnique({
    where: { farmerId_seasonId: { farmerId, seasonId } },
    select: { id: true },
  });

  if (!existing) {
    const hasActivity = await hasFinancialActivityForSeason(farmerId, seasonId);
    if (!hasActivity) return null;
  }

  const estimatedFinancials = await calculateSeasonFinancials(farmerId, seasonId);

  const summary = existing
    ? await prisma.financialSummary.update({
        where: { id: existing.id },
        data: estimatedFinancials,
        select: safeFinancialSummarySelect,
      })
    : await prisma.financialSummary.create({
        data: {
          farmerId,
          seasonId,
          ...estimatedFinancials,
        },
        select: safeFinancialSummarySelect,
      });

  await writeAuditLog({
    actorId: context.actorId,
    action: existing ? "UPDATE" : "CREATE",
    resource: "FARM",
    resourceId: summary.id,
    description: existing
      ? "Financial summary automatically recalculated"
      : "Financial summary automatically created",
    metadata: {
      farmerId,
      seasonId,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netProfit: summary.netProfit,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return summary;
};

export const refreshFinancialSummaryForCrop = async (
  cropId: string,
  context: RequestContext = {}
) => {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: {
      seasonId: true,
      farm: { select: { farmerId: true } },
    },
  });

  if (!crop) return null;

  return refreshFinancialSummaryForSeason(
    crop.farm.farmerId,
    crop.seasonId,
    context
  );
};

const refreshFinancialSummariesForFarmExpense = async (
  farmerId: string,
  expenseDate: Date,
  cropId: string | null | undefined,
  context: RequestContext = {}
) => {
  const affected = new Map<string, { farmerId: string; seasonId: string }>();

  if (cropId) {
    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      select: {
        seasonId: true,
        farm: { select: { farmerId: true } },
      },
    });

    if (crop && crop.farm.farmerId === farmerId) {
      affected.set(crop.seasonId, { farmerId, seasonId: crop.seasonId });
    }
  }

  const seasonsByDate = await prisma.farmingSeason.findMany({
    where: {
      startDate: { lte: expenseDate },
      endDate: { gte: expenseDate },
    },
    select: { id: true },
  });

  for (const season of seasonsByDate) {
    affected.set(season.id, { farmerId, seasonId: season.id });
  }

  await Promise.all(
    [...affected.values()].map((item) =>
      refreshFinancialSummaryForSeason(item.farmerId, item.seasonId, context)
    )
  );
};

const refreshFinancialSummariesForMarketCropNames = async (
  cropNames: string[],
  context: RequestContext = {}
) => {
  const uniqueCropNames = [
    ...new Set(
      cropNames
        .map((cropName) => cropName.trim())
        .filter((cropName) => cropName.length > 0)
    ),
  ];

  if (uniqueCropNames.length === 0) return;

  const yieldRecords = await prisma.yieldRecord.findMany({
    where: {
      OR: uniqueCropNames.map((cropName) => ({
        crop: {
          cropName: { equals: cropName, mode: "insensitive" },
        },
      })),
    },
    select: {
      crop: {
        select: {
          seasonId: true,
          farm: { select: { farmerId: true } },
        },
      },
    },
  });

  const affected = new Map<string, { farmerId: string; seasonId: string }>();

  for (const record of yieldRecords) {
    const key = normalizeLookupKey(
      record.crop.farm.farmerId,
      record.crop.seasonId
    );
    affected.set(key, {
      farmerId: record.crop.farm.farmerId,
      seasonId: record.crop.seasonId,
    });
  }

  await Promise.all(
    [...affected.values()].map((item) =>
      refreshFinancialSummaryForSeason(item.farmerId, item.seasonId, context)
    )
  );
};

/* ─────────────────────────────────────────
   FARM EXPENSE SERVICES
───────────────────────────────────────── */

export const createFarmExpenseService = async (
  userId: string,
  input: CreateFarmExpenseInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  if (input.cropId) {
    const crop = await prisma.crop.findUnique({
      where: { id: input.cropId },
      select: { id: true, farm: { select: { farmerId: true } } },
    });
    if (!crop) throw new APIError("Crop not found", 404);
    if (crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to add expenses to this crop", 403);
    }
  }

  const expense = await prisma.farmExpense.create({
    data: {
      farmerId,
      cropId: input.cropId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      expenseDate: input.expenseDate,
    },
    select: safeFarmExpenseSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARM",
    resourceId: expense.id,
    description: "Farm expense created",
    metadata: { type: input.type, amount: input.amount },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummariesForFarmExpense(
    farmerId,
    expense.expenseDate,
    expense.cropId,
    context
  );

  return expense;
};

export const getMyFarmExpensesService = async (
  userId: string,
  options: { skip?: number; limit?: number; cropId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10, cropId } = options;

  const where: Prisma.FarmExpenseWhereInput = {
    farmerId,
    ...(cropId && { cropId }),
  };

  const [expenses, total] = await Promise.all([
    prisma.farmExpense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeFarmExpenseSelect,
    }),
    prisma.farmExpense.count({ where }),
  ]);

  return {
    expenses,
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

export const getAllFarmExpensesService = async (
  options: { skip?: number; limit?: number; where?: Prisma.FarmExpenseWhereInput } = {}
) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [expenses, total] = await Promise.all([
    prisma.farmExpense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: farmExpenseWithFarmerSelect,
    }),
    prisma.farmExpense.count({ where }),
  ]);

  return {
    expenses,
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

export const getFarmExpenseByIdService = async (
  expenseId: string,
  userId?: string,
  isAdmin = false
) => {
  const expense = await prisma.farmExpense.findUnique({
    where: { id: expenseId },
    select: farmExpenseWithFarmerSelect,
  });

  if (!expense) throw new APIError("Farm expense not found", 404);

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (expense.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this expense", 403);
    }
  }

  return expense;
};

export const updateFarmExpenseService = async (
  expenseId: string,
  userId: string,
  input: UpdateFarmExpenseInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.farmExpense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      farmerId: true,
      cropId: true,
      expenseDate: true,
    },
  });

  if (!existing) throw new APIError("Farm expense not found", 404);

  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this expense", 403);
  }

  if (input.cropId) {
    const crop = await prisma.crop.findUnique({
      where: { id: input.cropId },
      select: { id: true, farm: { select: { farmerId: true } } },
    });
    if (!crop) throw new APIError("Crop not found", 404);
    if (crop.farm.farmerId !== farmerId) {
      throw new APIError("You are not authorized to link this crop to the expense", 403);
    }
  }

  const updated = await prisma.farmExpense.update({
    where: { id: expenseId },
    data: {
      cropId: input.cropId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      expenseDate: input.expenseDate,
    },
    select: safeFarmExpenseSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARM",
    resourceId: expenseId,
    description: "Farm expense updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await Promise.all([
    refreshFinancialSummariesForFarmExpense(
      farmerId,
      existing.expenseDate,
      existing.cropId,
      context
    ),
    refreshFinancialSummariesForFarmExpense(
      farmerId,
      updated.expenseDate,
      updated.cropId,
      context
    ),
  ]);

  return updated;
};

export const deleteFarmExpenseService = async (
  expenseId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  const expense = await prisma.farmExpense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      farmerId: true,
      cropId: true,
      expenseDate: true,
    },
  });

  if (!expense) throw new APIError("Farm expense not found", 404);

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (expense.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this expense", 403);
    }
  }

  await prisma.farmExpense.delete({ where: { id: expenseId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARM",
    resourceId: expenseId,
    description: "Farm expense deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummariesForFarmExpense(
    expense.farmerId,
    expense.expenseDate,
    expense.cropId,
    context
  );

  return { message: "Farm expense deleted successfully." };
};

/* ─────────────────────────────────────────
   FINANCIAL SUMMARY SERVICES
───────────────────────────────────────── */

export const createFinancialSummaryService = async (
  userId: string,
  input: CreateFinancialSummaryInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const estimatedFinancials = await calculateSeasonFinancials(
    farmerId,
    input.seasonId
  );

  const existing = await prisma.financialSummary.findUnique({
    where: { farmerId_seasonId: { farmerId, seasonId: input.seasonId } },
    select: { id: true },
  });
  if (existing) {
    throw new APIError(
      "A financial summary for this season already exists. Use update instead.",
      409
    );
  }

  const totalIncome = input.totalIncome ?? estimatedFinancials.totalIncome;
  const totalExpenses = input.totalExpenses ?? estimatedFinancials.totalExpenses;
  const netProfit = roundMoney(totalIncome - totalExpenses);

  const summary = await prisma.financialSummary.create({
    data: {
      farmerId,
      seasonId: input.seasonId,
      totalIncome,
      totalExpenses,
      netProfit,
      cashFlowStatus: getCashFlowStatus(netProfit),
      notes: input.notes ?? estimatedFinancials.notes,
    },
    select: safeFinancialSummarySelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARM",
    resourceId: summary.id,
    description: "Financial summary created",
    metadata: { seasonId: input.seasonId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return summary;
};

export const getMyFinancialSummariesService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10 } = options;

  const where: Prisma.FinancialSummaryWhereInput = { farmerId };

  const [summaries, total] = await Promise.all([
    prisma.financialSummary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeFinancialSummarySelect,
    }),
    prisma.financialSummary.count({ where }),
  ]);

  return {
    summaries,
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

export const getAllFinancialSummariesService = async (
  options: { skip?: number; limit?: number; where?: Prisma.FinancialSummaryWhereInput } = {}
) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [summaries, total] = await Promise.all([
    prisma.financialSummary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: financialSummaryWithFarmerSelect,
    }),
    prisma.financialSummary.count({ where }),
  ]);

  return {
    summaries,
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

export const getFinancialSummaryByIdService = async (
  summaryId: string,
  userId?: string,
  isAdmin = false
) => {
  const summary = await prisma.financialSummary.findUnique({
    where: { id: summaryId },
    select: financialSummaryWithFarmerSelect,
  });

  if (!summary) throw new APIError("Financial summary not found", 404);

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (summary.farmerId !== farmerId) {
      throw new APIError("You are not authorized to access this financial summary", 403);
    }
  }

  return summary;
};

export const updateFinancialSummaryService = async (
  summaryId: string,
  userId: string,
  input: UpdateFinancialSummaryInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.financialSummary.findUnique({
    where: { id: summaryId },
    select: {
      id: true,
      farmerId: true,
      totalIncome: true,
      totalExpenses: true,
    },
  });

  if (!existing) throw new APIError("Financial summary not found", 404);

  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this financial summary", 403);
  }

  const totalIncome = input.totalIncome ?? existing.totalIncome;
  const totalExpenses = input.totalExpenses ?? existing.totalExpenses;
  const netProfit = roundMoney(totalIncome - totalExpenses);
  const cashFlowStatus = getCashFlowStatus(netProfit);

  const updated = await prisma.financialSummary.update({
    where: { id: summaryId },
    data: {
      totalIncome,
      totalExpenses,
      netProfit,
      cashFlowStatus,
      notes: input.notes,
    },
    select: safeFinancialSummarySelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARM",
    resourceId: summaryId,
    description: "Financial summary updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return updated;
};

export const recalculateFinancialSummaryService = async (
  summaryId: string,
  userId: string,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const existing = await prisma.financialSummary.findUnique({
    where: { id: summaryId },
    select: { id: true, farmerId: true, seasonId: true },
  });

  if (!existing) throw new APIError("Financial summary not found", 404);

  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to recalculate this financial summary", 403);
  }

  const estimatedFinancials = await calculateSeasonFinancials(
    farmerId,
    existing.seasonId
  );

  const updated = await prisma.financialSummary.update({
    where: { id: summaryId },
    data: estimatedFinancials,
    select: safeFinancialSummarySelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARM",
    resourceId: summaryId,
    description: "Financial summary recalculated",
    metadata: {
      seasonId: existing.seasonId,
      totalIncome: estimatedFinancials.totalIncome,
      totalExpenses: estimatedFinancials.totalExpenses,
      netProfit: estimatedFinancials.netProfit,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(farmerId);

  return updated;
};

export const deleteFinancialSummaryService = async (
  summaryId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  const summary = await prisma.financialSummary.findUnique({
    where: { id: summaryId },
    select: { id: true, farmerId: true },
  });

  if (!summary) throw new APIError("Financial summary not found", 404);

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (summary.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this financial summary", 403);
    }
  }

  await prisma.financialSummary.delete({ where: { id: summaryId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARM",
    resourceId: summaryId,
    description: "Financial summary deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await triggerCreditScoreRecalculation(summary.farmerId);

  return { message: "Financial summary deleted successfully." };
};

/* ─────────────────────────────────────────
   MARKET PRICE SERVICES
───────────────────────────────────────── */

export const createMarketPriceService = async (
  input: CreateMarketPriceInput,
  context: RequestContext = {}
) => {
  const price = await prisma.marketPrice.create({
    data: {
      cropName: input.cropName,
      marketLocation: input.marketLocation,
      pricePerUnit: input.pricePerUnit,
      unit: input.unit ?? "kg",
      recordedAt: input.recordedAt ?? new Date(),
    },
    select: safeMarketPriceSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "CREATE",
    resource: "SYSTEM",
    resourceId: price.id,
    description: `Market price for "${input.cropName}" recorded`,
    metadata: { cropName: input.cropName, marketLocation: input.marketLocation },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummariesForMarketCropNames([price.cropName], context);

  // Fan-out market intelligence recommendations to matching farmers (fire-and-forget)
  void generateMarketPriceRecommendations(
    price.cropName,
    price.pricePerUnit,
    price.unit,
    price.marketLocation
  );

  return price;
};

export const getAllMarketPricesService = async (
  options: {
    skip?: number;
    limit?: number;
    cropName?: string;
    marketLocation?: string;
  } = {}
) => {
  const { skip = 0, limit = 10, cropName, marketLocation } = options;

  const where: Prisma.MarketPriceWhereInput = {
    ...(cropName && { cropName: { contains: cropName, mode: "insensitive" } }),
    ...(marketLocation && {
      marketLocation: { contains: marketLocation, mode: "insensitive" },
    }),
  };

  const [prices, total] = await Promise.all([
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { recordedAt: "desc" },
      select: safeMarketPriceSelect,
    }),
    prisma.marketPrice.count({ where }),
  ]);

  return {
    marketPrices: prices,
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

export const getMarketPriceByIdService = async (priceId: string) => {
  const price = await prisma.marketPrice.findUnique({
    where: { id: priceId },
    select: safeMarketPriceSelect,
  });

  if (!price) throw new APIError("Market price not found", 404);

  return price;
};

export const updateMarketPriceService = async (
  priceId: string,
  input: UpdateMarketPriceInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.marketPrice.findUnique({
    where: { id: priceId },
    select: { id: true, cropName: true },
  });

  if (!existing) throw new APIError("Market price not found", 404);

  const updated = await prisma.marketPrice.update({
    where: { id: priceId },
    data: {
      cropName: input.cropName,
      marketLocation: input.marketLocation,
      pricePerUnit: input.pricePerUnit,
      unit: input.unit,
      recordedAt: input.recordedAt,
    },
    select: safeMarketPriceSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "UPDATE",
    resource: "SYSTEM",
    resourceId: priceId,
    description: "Market price updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummariesForMarketCropNames(
    [existing.cropName, updated.cropName],
    context
  );

  return updated;
};

export const deleteMarketPriceService = async (
  priceId: string,
  context: RequestContext = {}
) => {
  const existing = await prisma.marketPrice.findUnique({
    where: { id: priceId },
    select: { id: true, cropName: true },
  });

  if (!existing) throw new APIError("Market price not found", 404);

  await prisma.marketPrice.delete({ where: { id: priceId } });

  await writeAuditLog({
    actorId: context.actorId,
    action: "DELETE",
    resource: "SYSTEM",
    resourceId: priceId,
    description: "Market price deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await refreshFinancialSummariesForMarketCropNames([existing.cropName], context);

  return { message: "Market price deleted successfully." };
};

/* ─────────────────────────────────────────
   FINANCIAL DASHBOARD
───────────────────────────────────────── */

export const getFinancialDashboardService = async (userId: string) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const today = new Date();

  const [allSummaries, activeSeason] = await Promise.all([
    prisma.financialSummary.findMany({
      where: { farmerId },
      orderBy: [
        { season: { year: "desc" } },
        { season: { startDate: "desc" } },
      ],
      select: {
        id: true,
        totalIncome: true,
        totalExpenses: true,
        netProfit: true,
        cashFlowStatus: true,
        notes: true,
        season: {
          select: { id: true, name: true, year: true },
        },
      },
    }),
    prisma.farmingSeason.findFirst({
      where: { startDate: { lte: today } },
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
      select: { id: true, name: true, year: true },
    }),
  ]);

  const totalSeasons = allSummaries.length;
  const profitableSeasons = allSummaries.filter(
    (s) => s.cashFlowStatus === "POSITIVE"
  ).length;
  const totalLifetimeIncome = roundMoney(
    allSummaries.reduce((s, r) => s + r.totalIncome, 0)
  );
  const totalLifetimeExpenses = roundMoney(
    allSummaries.reduce((s, r) => s + r.totalExpenses, 0)
  );
  const totalLifetimeNetProfit = roundMoney(
    totalLifetimeIncome - totalLifetimeExpenses
  );

  const bestSummary = allSummaries.reduce<(typeof allSummaries)[number] | null>(
    (best, r) => (!best || r.netProfit > best.netProfit ? r : best),
    null
  );

  const currentSeasonSummary = activeSeason
    ? (allSummaries.find((s) => s.season.id === activeSeason.id) ?? null)
    : null;

  const seasonalTrend = allSummaries.slice(0, 8).map((r) => ({
    season: `${r.season.name} ${r.season.year}`,
    totalIncome: r.totalIncome,
    totalExpenses: r.totalExpenses,
    netProfit: r.netProfit,
    cashFlowStatus: r.cashFlowStatus,
  }));

  return {
    summary: {
      totalSeasons,
      profitableSeasons,
      totalLifetimeIncome,
      totalLifetimeExpenses,
      totalLifetimeNetProfit,
      overallCashFlowStatus: getCashFlowStatus(totalLifetimeNetProfit),
      bestSeasonNetProfit: bestSummary?.netProfit ?? null,
      bestSeasonName: bestSummary
        ? `${bestSummary.season.name} ${bestSummary.season.year}`
        : null,
    },
    currentSeason: activeSeason
      ? { season: activeSeason, financialSummary: currentSeasonSummary }
      : null,
    seasonalTrend,
  };
};

/* ─────────────────────────────────────────
   LATEST MARKET PRICES (with staleness)
───────────────────────────────────────── */

const STALE_PRICE_DAYS = 7;

export const getLatestMarketPricesService = async () => {
  const today = new Date();

  const allPrices = await prisma.marketPrice.findMany({
    orderBy: { recordedAt: "desc" },
    select: safeMarketPriceSelect,
  });

  const latestByCrop = new Map<string, (typeof allPrices)[number]>();
  for (const price of allPrices) {
    const key = price.cropName.trim().toLowerCase();
    if (!latestByCrop.has(key)) {
      latestByCrop.set(key, price);
    }
  }

  const prices = Array.from(latestByCrop.values())
    .sort((a, b) => a.cropName.localeCompare(b.cropName))
    .map((p) => {
      const ageMs = today.getTime() - new Date(p.recordedAt).getTime();
      const ageInDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      return { ...p, ageInDays, isStale: ageInDays >= STALE_PRICE_DAYS };
    });

  const staleCount = prices.filter((p) => p.isStale).length;

  return {
    prices,
    meta: {
      totalCrops: prices.length,
      freshCount: prices.length - staleCount,
      staleCount,
      staleDaysThreshold: STALE_PRICE_DAYS,
    },
  };
};
