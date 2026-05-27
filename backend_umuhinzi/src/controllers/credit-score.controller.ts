import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";

import {
  generateCreditScoreService,
  getMyCreditScoresService,
  getAllCreditScoresService,
  getCreditScoreByIdService,
  getLatestCreditScoreService,
  getCreditScoresByFarmerIdService,
} from "../services/credit-score.service.js";

import { Role } from "../generated/prisma/client.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   GENERATE CREDIT SCORE
───────────────────────────────────────── */

export const generateCreditScore = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const targetFarmerId = req.body.farmerId as string | undefined;

    if (!isAdmin && targetFarmerId) {
      throw new APIError("Only admins can generate scores for other farmers", 403);
    }

    const creditScore = await generateCreditScoreService(
      req.user.id,
      targetFarmerId,
      isAdmin,
      getRequestContext(req)
    );

    logger.info("Credit score generated", {
      userId: req.user.id,
      scoreId: creditScore.id,
      score: creditScore.score,
      riskLevel: creditScore.riskLevel,
    });

    res.status(201).json({
      success: true,
      message: "Credit score generated successfully",
      data: creditScore,
    });
  }
);

/* ─────────────────────────────────────────
   GET CREDIT SCORES (LIST)
───────────────────────────────────────── */

export const getCreditScores = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isAdmin) {
      const result = await getMyCreditScoresService(req.user.id, { skip, limit });
      return res.status(200).json({
        success: true,
        message: "Credit scores fetched successfully",
        data: result.creditScores,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllCreditScoresService({ skip, limit });
    res.status(200).json({
      success: true,
      message: "Credit scores fetched successfully",
      data: result.creditScores,
      pagination: { page, ...result.pagination },
    });
  }
);

/* ─────────────────────────────────────────
   GET LATEST CREDIT SCORE
───────────────────────────────────────── */

export const getLatestCreditScore = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const creditScore = await getLatestCreditScoreService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Latest credit score fetched successfully",
      data: creditScore,
    });
  }
);

/* ─────────────────────────────────────────
   GET CREDIT SCORE BY ID
───────────────────────────────────────── */

export const getCreditScoreById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const creditScore = await getCreditScoreByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Credit score fetched successfully",
      data: creditScore,
    });
  }
);

/* ─────────────────────────────────────────
   GET CREDIT SCORES BY FARMER ID (ADMIN)
───────────────────────────────────────── */

export const getCreditScoresByFarmerId = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const creditScores = await getCreditScoresByFarmerIdService(
      String(req.params.farmerId)
    );

    res.status(200).json({
      success: true,
      message: "Credit scores for farmer fetched successfully",
      data: creditScores,
    });
  }
);
