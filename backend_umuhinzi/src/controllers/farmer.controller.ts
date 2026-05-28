import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createFarmerProfileService,
  getMyFarmerProfileService,
  getAllFarmersService,
  getFarmerByIdService,
  updateMyFarmerProfileService,
  updateFarmerStatusService,
  updateFarmerCredibilityService,
  getFarmerStatsService,
} from "../services/farmer.service.js";

import type { Prisma } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─── create farmer profile ─── */

export const createFarmerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const farmer = await createFarmerProfileService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Farmer profile created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Farmer profile created successfully",
      data: farmer,
    });
  }
);

/* ─── get my profile ─── */

export const getMyFarmerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const farmer = await getMyFarmerProfileService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Farmer profile fetched successfully",
      data: farmer,
    });
  }
);

/* ─── get all farmers (admin) ─── */

export const getAllFarmers = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

    const statusValue = req.query.status
      ? String(req.query.status).toUpperCase()
      : undefined;

    const credibilityValue = req.query.credibility
      ? String(req.query.credibility).toUpperCase()
      : undefined;

    const district = req.query.district
      ? String(req.query.district).trim()
      : undefined;

    const search = req.query.search
      ? String(req.query.search).trim()
      : undefined;

    const where: Prisma.FarmerWhereInput = {
      ...(statusValue && { status: statusValue as Prisma.EnumFarmerStatusFilter }),
      ...(credibilityValue && {
        credibilityStatus: credibilityValue as Prisma.EnumCredibilityStatusFilter,
      }),
      ...(district && {
        user: {
          district: { equals: district, mode: "insensitive" },
        },
      }),
      ...(search && {
        user: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    };

    const result = await getAllFarmersService({ skip, limit, where });

    res.status(200).json({
      success: true,
      message: "Farmers fetched successfully",
      data: result.farmers,
      pagination: { page, ...result.pagination },
    });
  }
);

/* ─── get farmer by ID (admin) ─── */

export const getFarmerById = asyncHandler(
  async (req: Request, res: Response) => {
    const farmer = await getFarmerByIdService(String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Farmer fetched successfully",
      data: farmer,
    });
  }
);

/* ─── update my profile ─── */

export const updateMyFarmerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const farmer = await updateMyFarmerProfileService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Farmer profile updated", { userId: req.user.id });

    res.status(200).json({
      success: true,
      message: "Farmer profile updated successfully",
      data: farmer,
    });
  }
);

/* ─── update farmer status (admin) ─── */

export const updateFarmerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const farmer = await updateFarmerStatusService(
      String(req.params.id),
      req.body,
      getRequestContext(req)
    );

    logger.info("Farmer status updated", {
      farmerId: req.params.id,
      updatedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "Farmer status updated successfully",
      data: farmer,
    });
  }
);

/* ─── update farmer credibility (admin) ─── */

export const updateFarmerCredibility = asyncHandler(
  async (req: Request, res: Response) => {
    const farmer = await updateFarmerCredibilityService(
      String(req.params.id),
      req.body,
      getRequestContext(req)
    );

    logger.info("Farmer credibility updated", {
      farmerId: req.params.id,
      updatedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "Farmer credibility updated successfully",
      data: farmer,
    });
  }
);

/* ─── farmer stats (admin) ─── */

export const getFarmerStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await getFarmerStatsService();

    res.status(200).json({
      success: true,
      message: "Farmer statistics fetched successfully",
      data: stats,
    });
  }
);
