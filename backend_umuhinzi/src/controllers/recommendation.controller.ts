import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import {
  createRecommendationService,
  getRecommendationsService,
  getRecommendationByIdService,
  markRecommendationReadService,
} from "../services/recommendation.service.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

export const createRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const recommendation = await createRecommendationService(
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(201).json({
    success: true,
    message: "Recommendation created successfully",
    data: recommendation,
  });
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const result = await getRecommendationsService(req.user.id, req.user.role, {
    skip,
    limit,
  });

  res.status(200).json({
    success: true,
    message: "Recommendations fetched successfully",
    data: result.recommendations,
    pagination: { page, ...result.pagination },
  });
});

export const getRecommendationById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const recommendation = await getRecommendationByIdService(
    String(req.params.id),
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Recommendation fetched successfully",
    data: recommendation,
  });
});

export const markRecommendationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const recommendation = await markRecommendationReadService(
    String(req.params.id),
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Recommendation marked as read",
    data: recommendation,
  });
});
