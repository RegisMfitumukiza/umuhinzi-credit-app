import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  createLivestockService,
  getMyLivestockService,
  getAllLivestockService,
  getLivestockByIdService,
  updateLivestockService,
  deleteLivestockService,
} from "../services/livestock.service.js";

import { Role } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─── create ─── */

export const createLivestock = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const livestock = await createLivestockService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Livestock record created", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: "Livestock record created successfully",
      data: livestock,
    });
  }
);

/* ─── get list (farmer sees own, admin sees all) ─── */

export const getLivestock = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(
      req.query.limit,
      req.query.page
    );

    const isAdmin = req.user.role === Role.ADMIN;

    if (!isAdmin) {
      const result = await getMyLivestockService(req.user.id, { skip, limit });

      return res.status(200).json({
        success: true,
        message: "Livestock fetched successfully",
        data: result.livestock,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllLivestockService({ skip, limit });

    res.status(200).json({
      success: true,
      message: "Livestock fetched successfully",
      data: result.livestock,
      pagination: { page, ...result.pagination },
    });
  }
);

/* ─── get by ID ─── */

export const getLivestockById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;

    const livestock = await getLivestockByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Livestock record fetched successfully",
      data: livestock,
    });
  }
);

/* ─── update ─── */

export const updateLivestock = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const livestock = await updateLivestockService(
      String(req.params.id),
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("Livestock updated", {
      livestockId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Livestock record updated successfully",
      data: livestock,
    });
  }
);

/* ─── delete ─── */

export const deleteLivestock = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;

    const result = await deleteLivestockService(
      String(req.params.id),
      req.user.id,
      isAdmin,
      getRequestContext(req)
    );

    logger.warn("Livestock deleted", {
      livestockId: req.params.id,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);
