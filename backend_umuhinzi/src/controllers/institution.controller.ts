import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { Role } from "../generated/prisma/client.js";

import {
  createInstitutionService,
  getAllInstitutionsService,
  getInstitutionByIdService,
  updateInstitutionService,
  updateInstitutionStatusService,
  deleteInstitutionService,
} from "../services/institution.service.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   CREATE INSTITUTION
───────────────────────────────────────── */

export const createInstitution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const institution = await createInstitutionService(
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(201).json({
    success: true,
    message: "Institution profile created successfully",
    data: institution,
  });
});

/* ─────────────────────────────────────────
   GET ALL INSTITUTIONS
───────────────────────────────────────── */

export const getInstitutions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  // INSTITUTION sees only their own. FARMER sees active institutions for loan selection.
  const institutionUserId = req.user.role === Role.INSTITUTION ? req.user.id : undefined;
  const status = req.user.role === Role.FARMER ? "ACTIVE" : undefined;

  const result = await getAllInstitutionsService({ skip, limit, institutionUserId, status });

  res.status(200).json({
    success: true,
    message: "Institutions fetched successfully",
    data: result.institutions,
    pagination: { page, ...result.pagination },
  });
});

/* ─────────────────────────────────────────
   GET AVAILABLE INSTITUTIONS (PUBLIC)
───────────────────────────────────────── */

export const getAvailableInstitutions = asyncHandler(async (_req: Request, res: Response) => {
  const { institutions } = await getAllInstitutionsService({
    status: "ACTIVE",
    limit: 100,
    skip: 0,
  });

  res.status(200).json({
    success: true,
    message: "Available institutions fetched successfully",
    data: institutions,
  });
});

/* ─────────────────────────────────────────
   GET INSTITUTION BY ID
───────────────────────────────────────── */

export const getInstitutionById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const institution = await getInstitutionByIdService(
    String(req.params.id),
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Institution fetched successfully",
    data: institution,
  });
});

/* ─────────────────────────────────────────
   UPDATE INSTITUTION
───────────────────────────────────────── */

export const updateInstitution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const institution = await updateInstitutionService(
    String(req.params.id),
    req.user.id,
    req.user.role,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Institution updated successfully",
    data: institution,
  });
});

/* ─────────────────────────────────────────
   UPDATE INSTITUTION STATUS (ADMIN)
───────────────────────────────────────── */

export const updateInstitutionStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const institution = await updateInstitutionStatusService(
    String(req.params.id),
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Institution status updated successfully",
    data: institution,
  });
});

/* ─────────────────────────────────────────
   DELETE INSTITUTION (ADMIN)
───────────────────────────────────────── */

export const deleteInstitution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await deleteInstitutionService(
    String(req.params.id),
    req.user.id,
    getContext(req)
  );

  res.status(200).json({ success: true, ...result });
});
