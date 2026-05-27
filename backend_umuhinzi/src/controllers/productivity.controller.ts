import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createYieldRecordService,
  getMyYieldRecordsService,
  getAllYieldRecordsService,
  getYieldRecordByIdService,
  updateYieldRecordService,
  deleteYieldRecordService,
  createInputCostService,
  getMyInputCostsService,
  getAllInputCostsService,
  getInputCostByIdService,
  updateInputCostService,
  deleteInputCostService,
  createProductivityRecordService,
  getMyProductivityRecordsService,
  getAllProductivityRecordsService,
  getProductivityRecordByIdService,
  updateProductivityRecordService,
  deleteProductivityRecordService,
} from "../services/productivity.service.js";

import { Role } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   YIELD RECORD CONTROLLERS
───────────────────────────────────────── */

export const createYieldRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await createYieldRecordService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Yield record created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Yield record created successfully",
      data: record,
    });
  }
);

export const getYieldRecords = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;
    const cropId = req.query.cropId ? String(req.query.cropId) : undefined;

    if (!isAdmin) {
      const result = await getMyYieldRecordsService(req.user.id, { skip, limit, cropId });
      return res.status(200).json({
        success: true,
        message: "Yield records fetched successfully",
        data: result.yields,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllYieldRecordsService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Yield records fetched successfully",
      data: result.yields,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getYieldRecordById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const record = await getYieldRecordByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Yield record fetched successfully",
      data: record,
    });
  }
);

export const updateYieldRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await updateYieldRecordService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Yield record updated", {
      recordId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Yield record updated successfully",
      data: record,
    });
  }
);

export const deleteYieldRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const result = await deleteYieldRecordService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Yield record deleted", {
      recordId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

/* ─────────────────────────────────────────
   INPUT COST CONTROLLERS
───────────────────────────────────────── */

export const createInputCost = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await createInputCostService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Input cost created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Input cost created successfully",
      data: record,
    });
  }
);

export const getInputCosts = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;
    const cropId = req.query.cropId ? String(req.query.cropId) : undefined;

    if (!isAdmin) {
      const result = await getMyInputCostsService(req.user.id, { skip, limit, cropId });
      return res.status(200).json({
        success: true,
        message: "Input costs fetched successfully",
        data: result.inputCosts,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllInputCostsService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Input costs fetched successfully",
      data: result.inputCosts,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getInputCostById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const record = await getInputCostByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Input cost fetched successfully",
      data: record,
    });
  }
);

export const updateInputCost = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await updateInputCostService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Input cost updated", {
      recordId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Input cost updated successfully",
      data: record,
    });
  }
);

export const deleteInputCost = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const result = await deleteInputCostService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Input cost deleted", {
      recordId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

/* ─────────────────────────────────────────
   PRODUCTIVITY RECORD CONTROLLERS
───────────────────────────────────────── */

export const createProductivityRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await createProductivityRecordService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Productivity record created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Productivity record created successfully",
      data: record,
    });
  }
);

export const getProductivityRecords = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isAdmin) {
      const result = await getMyProductivityRecordsService(req.user.id, { skip, limit });
      return res.status(200).json({
        success: true,
        message: "Productivity records fetched successfully",
        data: result.productivityRecords,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllProductivityRecordsService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Productivity records fetched successfully",
      data: result.productivityRecords,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getProductivityRecordById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const record = await getProductivityRecordByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Productivity record fetched successfully",
      data: record,
    });
  }
);

export const updateProductivityRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const record = await updateProductivityRecordService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Productivity record updated", {
      recordId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Productivity record updated successfully",
      data: record,
    });
  }
);

export const deleteProductivityRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const result = await deleteProductivityRecordService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Productivity record deleted", {
      recordId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);
