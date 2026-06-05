import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import type {
  RecommendationStatus,
  RecommendationType,
  RecommendationPriority,
} from "../generated/prisma/client.js";

import {
  createRecommendationService,
  getRecommendationsService,
  getRecommendationByIdService,
  updateRecommendationService,
  deleteRecommendationService,
  dismissRecommendationService,
  markRecommendationReadService,
} from "../services/recommendation.service.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

const VALID_STATUSES: RecommendationStatus[] = ["ACTIVE", "READ", "ARCHIVED", "DISMISSED"];
const VALID_TYPES: RecommendationType[] = [
  "LOAN_AMOUNT",
  "FINANCIAL_IMPROVEMENT",
  "REPAYMENT_STRATEGY",
  "PRODUCTIVITY",
  "RISK_REDUCTION",
  "DATA_COMPLETENESS",
  "GENERAL_ADVISORY",
];
const VALID_PRIORITIES: RecommendationPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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

  const rawStatus = req.query.status ? String(req.query.status) : undefined;
  const rawType = req.query.type ? String(req.query.type) : undefined;
  const rawPriority = req.query.priority ? String(req.query.priority) : undefined;

  const status = VALID_STATUSES.includes(rawStatus as RecommendationStatus)
    ? (rawStatus as RecommendationStatus)
    : undefined;
  const type = VALID_TYPES.includes(rawType as RecommendationType)
    ? (rawType as RecommendationType)
    : undefined;
  const priority = VALID_PRIORITIES.includes(rawPriority as RecommendationPriority)
    ? (rawPriority as RecommendationPriority)
    : undefined;

  const result = await getRecommendationsService(req.user.id, req.user.role, {
    skip,
    limit,
    status,
    type,
    priority,
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

export const updateRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const recommendation = await updateRecommendationService(
    String(req.params.id),
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Recommendation updated successfully",
    data: recommendation,
  });
});

export const deleteRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await deleteRecommendationService(
    String(req.params.id),
    getContext(req)
  );

  res.status(200).json({ success: true, ...result });
});

export const dismissRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const recommendation = await dismissRecommendationService(
    String(req.params.id),
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Recommendation dismissed",
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
