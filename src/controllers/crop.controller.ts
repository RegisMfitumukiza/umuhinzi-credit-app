import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createSeasonService,
  getAllSeasonsService,
  getSeasonByIdService,
  createCropService,
  getMyCropsService,
  getAllCropsService,
  getCropByIdService,
  updateCropService,
  deleteCropService,
} from "../services/crop.service.js";

import { Role } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   FARMING SEASON CONTROLLERS
───────────────────────────────────────── */

export const createSeason = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const season = await createSeasonService(req.body, getRequestContext(req));

    logger.info("Farming season created", { name: req.body.name });

    res.status(201).json({
      success: true,
      message: "Farming season created successfully",
      data: season,
    });
  }
);

export const getAllSeasons = asyncHandler(
  async (_req: Request, res: Response) => {
    const seasons = await getAllSeasonsService();

    res.status(200).json({
      success: true,
      message: "Farming seasons fetched successfully",
      data: seasons,
    });
  }
);

export const getSeasonById = asyncHandler(
  async (req: Request, res: Response) => {
    const season = await getSeasonByIdService(String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Farming season fetched successfully",
      data: season,
    });
  }
);

/* ─────────────────────────────────────────
   CROP CONTROLLERS
───────────────────────────────────────── */

export const createCrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const crop = await createCropService(
    req.user.id,
    req.body,
    getRequestContext(req)
  );

  logger.info("Crop created", { userId: req.user.id });

  res.status(201).json({
    success: true,
    message: "Crop created successfully",
    data: crop,
  });
});

export const getCrops = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const isAdmin = req.user.role === Role.ADMIN;

  const farmId = req.query.farmId ? String(req.query.farmId) : undefined;

  if (!isAdmin) {
    const result = await getMyCropsService(req.user.id, { skip, limit, farmId });

    return res.status(200).json({
      success: true,
      message: "Crops fetched successfully",
      data: result.crops,
      pagination: { page, ...result.pagination },
    });
  }

  const result = await getAllCropsService({ skip, limit });

  res.status(200).json({
    success: true,
    message: "Crops fetched successfully",
    data: result.crops,
    pagination: { page, ...result.pagination },
  });
});

export const getCropById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;

    const crop = await getCropByIdService(String(req.params.id), req.user.id, isAdmin);

    res.status(200).json({
      success: true,
      message: "Crop fetched successfully",
      data: crop,
    });
  }
);

export const updateCrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const crop = await updateCropService(
    String(req.params.id),
    req.user.id,
    req.body,
    getRequestContext(req)
  );

  logger.info("Crop updated", { cropId: req.params.id, userId: req.user.id });

  res.status(200).json({
    success: true,
    message: "Crop updated successfully",
    data: crop,
  });
});

export const deleteCrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const isAdmin = req.user.role === Role.ADMIN;

  const result = await deleteCropService(
    String(req.params.id),
    req.user.id,
    isAdmin,
    getRequestContext(req)
  );

  logger.warn("Crop deleted", {
    cropId: req.params.id,
    deletedBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
