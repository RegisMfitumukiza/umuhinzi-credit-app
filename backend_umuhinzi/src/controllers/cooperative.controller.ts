import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import {
  createCooperativeService,
  getAllCooperativesService,
  getCooperativeByIdService,
  updateCooperativeService,
  deleteCooperativeService,
  addCooperativeMemberService,
  getCooperativeMembersService,
  removeCooperativeMemberService,
  updateCooperativeMemberService,
  updateCooperativeStatusService,
} from "../services/cooperative.service.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   COOPERATIVES
───────────────────────────────────────── */

export const createCooperative = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const cooperative = await createCooperativeService(
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(201).json({
    success: true,
    message: "Cooperative created successfully",
    data: cooperative,
  });
});

export const getCooperatives = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const result = await getAllCooperativesService({ skip, limit });

  res.status(200).json({
    success: true,
    message: "Cooperatives fetched successfully",
    data: result.cooperatives,
    pagination: { page, ...result.pagination },
  });
});

export const getCooperativeById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const cooperative = await getCooperativeByIdService(String(req.params.id));

  res.status(200).json({
    success: true,
    message: "Cooperative fetched successfully",
    data: cooperative,
  });
});

export const updateCooperative = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const cooperative = await updateCooperativeService(
    String(req.params.id),
    req.user.id,
    req.user.role,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Cooperative updated successfully",
    data: cooperative,
  });
});

export const deleteCooperative = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await deleteCooperativeService(
    String(req.params.id),
    req.user.id,
    getContext(req)
  );

  res.status(200).json({ success: true, ...result });
});

export const updateCooperativeStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { status } = req.body as { status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" };

  const cooperative = await updateCooperativeStatusService(
    String(req.params.id),
    req.user.id,
    status,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Cooperative status updated successfully",
    data: cooperative,
  });
});

/* ─────────────────────────────────────────
   COOPERATIVE MEMBERS
───────────────────────────────────────── */

export const addCooperativeMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const member = await addCooperativeMemberService(
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(201).json({
    success: true,
    message: "Joined cooperative successfully",
    data: member,
  });
});

export const updateCooperativeMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const member = await updateCooperativeMemberService(
    String(req.params.id),
    req.user.id,
    req.user.role,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Cooperative member updated successfully",
    data: member,
  });
});

export const getCooperativeMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
  const cooperativeId = req.query.cooperativeId
    ? String(req.query.cooperativeId)
    : undefined;

  const result = await getCooperativeMembersService(req.user.id, req.user.role, {
    skip,
    limit,
    cooperativeId,
  });

  res.status(200).json({
    success: true,
    message: "Cooperative members fetched successfully",
    data: result.members,
    pagination: { page, ...result.pagination },
  });
});

export const removeCooperativeMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await removeCooperativeMemberService(
    String(req.params.id),
    req.user.id,
    req.user.role,
    getContext(req)
  );

  res.status(200).json({ success: true, ...result });
});
