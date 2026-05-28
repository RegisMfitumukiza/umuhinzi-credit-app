import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createFarmService,
  getMyFarmsService,
  getAllFarmsService,
  getFarmByIdService,
  updateFarmService,
  updateFarmStatusService,
  deleteFarmService,
} from "../services/farm.service.js";

import { Role } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─── create farm ─── */

export const createFarm = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const farm = await createFarmService(
    req.user.id,
    req.body,
    getRequestContext(req)
  );

  logger.info("Farm created", { userId: req.user.id });

  res.status(201).json({
    success: true,
    message: "Farm created successfully",
    data: farm,
  });
});

/* ─── get farms (farmer sees own, admin sees all) ─── */

export const getFarms = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const isAdmin = req.user.role === Role.ADMIN;

  if (!isAdmin) {
    const result = await getMyFarmsService(req.user.id, { skip, limit });

    return res.status(200).json({
      success: true,
      message: "Farms fetched successfully",
      data: result.farms,
      pagination: { page, ...result.pagination },
    });
  }

  const district = req.query.district
    ? String(req.query.district).trim()
    : undefined;

  const statusValue = req.query.status
    ? String(req.query.status).toUpperCase()
    : undefined;

  const where: Prisma.FarmWhereInput = {
    ...(district && {
      district: { equals: district, mode: "insensitive" },
    }),
    ...(statusValue && { status: statusValue as Prisma.EnumFarmStatusFilter }),
  };

  const result = await getAllFarmsService({ skip, limit, where });

  res.status(200).json({
    success: true,
    message: "Farms fetched successfully",
    data: result.farms,
    pagination: { page, ...result.pagination },
  });
});

/* ─── get single farm ─── */

export const getFarmById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;

    const farm = await getFarmByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Farm fetched successfully",
      data: farm,
    });
  }
);

/* ─── update farm ─── */

export const updateFarm = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const farm = await updateFarmService(
    String(req.params.id),
    req.user.id,
    req.body,
    getRequestContext(req)
  );

  logger.info("Farm updated", { farmId: req.params.id, userId: req.user.id });

  res.status(200).json({
    success: true,
    message: "Farm updated successfully",
    data: farm,
  });
});

/* ─── update farm status (admin) ─── */

export const updateFarmStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const farm = await updateFarmStatusService(
      String(req.params.id),
      req.body,
      getRequestContext(req)
    );

    logger.info("Farm status updated", {
      farmId: req.params.id,
      updatedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "Farm status updated successfully",
      data: farm,
    });
  }
);

/* ─── delete farm ─── */

export const deleteFarm = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const isAdmin = req.user.role === Role.ADMIN;

  const result = await deleteFarmService(
    String(req.params.id),
    req.user.id,
    isAdmin,
    getRequestContext(req)
  );

  logger.warn("Farm deleted", {
    farmId: req.params.id,
    deletedBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
