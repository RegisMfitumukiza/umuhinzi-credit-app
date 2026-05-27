import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { getAuditLogsService } from "../services/audit-log.service.js";

import type { Prisma } from "../generated/prisma/client.js";

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const where: Prisma.AuditLogWhereInput = {};

  if (req.query.actorId) where.actorId = String(req.query.actorId);
  if (req.query.action) where.action = req.query.action as never;
  if (req.query.resource) where.resource = req.query.resource as never;
  if (req.query.resourceId) where.resourceId = String(req.query.resourceId);

  // Date range filter
  if (req.query.from || req.query.to) {
    where.createdAt = {
      ...(req.query.from && { gte: new Date(String(req.query.from)) }),
      ...(req.query.to && { lte: new Date(String(req.query.to)) }),
    };
  }

  const result = await getAuditLogsService({ skip, limit, where });

  res.status(200).json({
    success: true,
    message: "Audit logs fetched successfully",
    data: result.auditLogs,
    pagination: { page, ...result.pagination },
  });
});
