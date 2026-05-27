import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createFarmExpenseService,
  getMyFarmExpensesService,
  getAllFarmExpensesService,
  getFarmExpenseByIdService,
  updateFarmExpenseService,
  deleteFarmExpenseService,
  createFinancialSummaryService,
  getMyFinancialSummariesService,
  getAllFinancialSummariesService,
  getFinancialSummaryByIdService,
  updateFinancialSummaryService,
  deleteFinancialSummaryService,
  createMarketPriceService,
  getAllMarketPricesService,
  getMarketPriceByIdService,
  updateMarketPriceService,
  deleteMarketPriceService,
} from "../services/finance.service.js";

import { Role } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   FARM EXPENSE CONTROLLERS
───────────────────────────────────────── */

export const createFarmExpense = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const expense = await createFarmExpenseService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Farm expense created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Farm expense created successfully",
      data: expense,
    });
  }
);

export const getFarmExpenses = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;
    const cropId = req.query.cropId ? String(req.query.cropId) : undefined;

    if (!isAdmin) {
      const result = await getMyFarmExpensesService(req.user.id, { skip, limit, cropId });
      return res.status(200).json({
        success: true,
        message: "Farm expenses fetched successfully",
        data: result.expenses,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllFarmExpensesService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Farm expenses fetched successfully",
      data: result.expenses,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getFarmExpenseById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const expense = await getFarmExpenseByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Farm expense fetched successfully",
      data: expense,
    });
  }
);

export const updateFarmExpense = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const expense = await updateFarmExpenseService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Farm expense updated", {
      expenseId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Farm expense updated successfully",
      data: expense,
    });
  }
);

export const deleteFarmExpense = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const result = await deleteFarmExpenseService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Farm expense deleted", {
      expenseId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

/* ─────────────────────────────────────────
   FINANCIAL SUMMARY CONTROLLERS
───────────────────────────────────────── */

export const createFinancialSummary = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const summary = await createFinancialSummaryService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Financial summary created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Financial summary created successfully",
      data: summary,
    });
  }
);

export const getFinancialSummaries = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isAdmin) {
      const result = await getMyFinancialSummariesService(req.user.id, { skip, limit });
      return res.status(200).json({
        success: true,
        message: "Financial summaries fetched successfully",
        data: result.summaries,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllFinancialSummariesService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Financial summaries fetched successfully",
      data: result.summaries,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getFinancialSummaryById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const summary = await getFinancialSummaryByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Financial summary fetched successfully",
      data: summary,
    });
  }
);

export const updateFinancialSummary = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const summary = await updateFinancialSummaryService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Financial summary updated", {
      summaryId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Financial summary updated successfully",
      data: summary,
    });
  }
);

export const deleteFinancialSummary = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const result = await deleteFinancialSummaryService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Financial summary deleted", {
      summaryId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

/* ─────────────────────────────────────────
   MARKET PRICE CONTROLLERS
───────────────────────────────────────── */

export const createMarketPrice = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const price = await createMarketPriceService(
      req.body,
      getRequestContext(req)
    );

    logger.info("Market price created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Market price created successfully",
      data: price,
    });
  }
);

export const getMarketPrices = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const cropName = req.query.cropName ? String(req.query.cropName) : undefined;
    const marketLocation = req.query.marketLocation
      ? String(req.query.marketLocation)
      : undefined;

    const result = await getAllMarketPricesService({
      skip,
      limit,
      cropName,
      marketLocation,
    });

    res.status(200).json({
      success: true,
      message: "Market prices fetched successfully",
      data: result.marketPrices,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getMarketPriceById = asyncHandler(
  async (req: Request, res: Response) => {
    const price = await getMarketPriceByIdService(String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Market price fetched successfully",
      data: price,
    });
  }
);

export const updateMarketPrice = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const price = await updateMarketPriceService(
      String(req.params.id),
      req.body,
      getRequestContext(req)
    );

    logger.info("Market price updated", {
      priceId: req.params.id,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Market price updated successfully",
      data: price,
    });
  }
);

export const deleteMarketPrice = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const result = await deleteMarketPriceService(
      String(req.params.id),
      getRequestContext(req)
    );

    logger.warn("Market price deleted", {
      priceId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);
