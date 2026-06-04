import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import {
  getPlatformAnalyticsService,
  getFarmerAnalyticsService,
  getRegionalAnalyticsService,
  generateAnalyticsReportService,
  getAnalyticsReportsService,
} from "../services/analytics.service.js";

export const getPlatformAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const data = await getPlatformAnalyticsService();

  res.status(200).json({
    success: true,
    message: "Platform analytics fetched successfully",
    data,
  });
});

export const getFarmerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const data = await getFarmerAnalyticsService(
    String(req.params.id),
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Farmer analytics fetched successfully",
    data,
  });
});

export const getRegionalAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const data = await getRegionalAnalyticsService();

  res.status(200).json({
    success: true,
    message: "Regional analytics fetched successfully",
    data,
  });
});

export const generateAnalyticsReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const report = await generateAnalyticsReportService(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Analytics report generated successfully",
    data: report,
  });
});

export const getAnalyticsReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
  const reportType = req.query.reportType ? String(req.query.reportType) : undefined;

  const result = await getAnalyticsReportsService({ skip, limit, reportType });

  res.status(200).json({
    success: true,
    message: "Analytics reports fetched successfully",
    data: result.reports,
    pagination: { page, ...result.pagination },
  });
});
