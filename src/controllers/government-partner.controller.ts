import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import {
  createGovernmentPartnerService,
  getMyGovernmentPartnerProfileService,
  getGovernmentPartnersService,
  getGovernmentPartnerByIdService,
  updateGovernmentPartnerStatusService,
} from "../services/government-partner.service.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   CREATE PROFILE
───────────────────────────────────────── */

export const createGovernmentPartner = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const partner = await createGovernmentPartnerService(
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(201).json({
    success: true,
    message: "Government partner profile created. Pending admin approval.",
    data: partner,
  });
});

/* ─────────────────────────────────────────
   GET MY PROFILE
───────────────────────────────────────── */

export const getMyGovernmentPartnerProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const partner = await getMyGovernmentPartnerProfileService(req.user.id);

  res.status(200).json({
    success: true,
    message: "Government partner profile fetched successfully",
    data: partner,
  });
});

/* ─────────────────────────────────────────
   GET ALL (ADMIN)
───────────────────────────────────────── */

export const getGovernmentPartners = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
  const status = req.query.status ? String(req.query.status) : undefined;

  const result = await getGovernmentPartnersService({ skip, limit, status });

  res.status(200).json({
    success: true,
    message: "Government partners fetched successfully",
    data: result.partners,
    pagination: { page, ...result.pagination },
  });
});

/* ─────────────────────────────────────────
   GET BY ID
───────────────────────────────────────── */

export const getGovernmentPartnerById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const partner = await getGovernmentPartnerByIdService(
    String(req.params.id),
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Government partner profile fetched successfully",
    data: partner,
  });
});

/* ─────────────────────────────────────────
   UPDATE STATUS (ADMIN)
───────────────────────────────────────── */

export const updateGovernmentPartnerStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const partner = await updateGovernmentPartnerStatusService(
    String(req.params.id),
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Government partner status updated successfully",
    data: partner,
  });
});
