import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
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
    select: { id: true, farmerId: true },
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

  return updated;
};

export const deleteFarmExpenseService = async (
  expenseId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    const expense = await prisma.farmExpense.findUnique({
      where: { id: expenseId },
      select: { id: true, farmerId: true },
    });
    if (!expense) throw new APIError("Farm expense not found", 404);
    if (expense.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this expense", 403);
    }
  } else {
    const expense = await prisma.farmExpense.findUnique({
      where: { id: expenseId },
      select: { id: true },
    });
    if (!expense) throw new APIError("Farm expense not found", 404);
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

  const season = await prisma.farmingSeason.findUnique({
    where: { id: input.seasonId },
    select: { id: true },
  });
  if (!season) throw new APIError("Farming season not found", 404);

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

  const summary = await prisma.financialSummary.create({
    data: {
      farmerId,
      seasonId: input.seasonId,
      totalIncome: input.totalIncome ?? 0,
      totalExpenses: input.totalExpenses ?? 0,
      netProfit: input.netProfit ?? 0,
      cashFlowStatus: input.cashFlowStatus ?? "NEUTRAL",
      notes: input.notes,
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
    select: { id: true, farmerId: true },
  });

  if (!existing) throw new APIError("Financial summary not found", 404);

  if (existing.farmerId !== farmerId) {
    throw new APIError("You are not authorized to update this financial summary", 403);
  }

  const updated = await prisma.financialSummary.update({
    where: { id: summaryId },
    data: {
      totalIncome: input.totalIncome,
      totalExpenses: input.totalExpenses,
      netProfit: input.netProfit,
      cashFlowStatus: input.cashFlowStatus,
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

  return updated;
};

export const deleteFinancialSummaryService = async (
  summaryId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    const summary = await prisma.financialSummary.findUnique({
      where: { id: summaryId },
      select: { id: true, farmerId: true },
    });
    if (!summary) throw new APIError("Financial summary not found", 404);
    if (summary.farmerId !== farmerId) {
      throw new APIError("You are not authorized to delete this financial summary", 403);
    }
  } else {
    const summary = await prisma.financialSummary.findUnique({
      where: { id: summaryId },
      select: { id: true },
    });
    if (!summary) throw new APIError("Financial summary not found", 404);
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
    select: { id: true },
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

  return updated;
};

export const deleteMarketPriceService = async (
  priceId: string,
  context: RequestContext = {}
) => {
  const existing = await prisma.marketPrice.findUnique({
    where: { id: priceId },
    select: { id: true },
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

  return { message: "Market price deleted successfully." };
};
