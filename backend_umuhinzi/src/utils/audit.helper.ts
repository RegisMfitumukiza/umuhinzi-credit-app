import { prisma } from "../lib/prisma.js";
import { logger } from "./logger.js";

import type {
  AuditAction,
  AuditResource,
  Prisma,
} from "../generated/prisma/client.js";

type AuditInput = {
  actorId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export const writeAuditLog = async (input: AuditInput) => {
  try {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action: input.action,
      resource: input.resource,
      ...(input.actorId && { actorId: input.actorId }),
      ...(input.resourceId && { resourceId: input.resourceId }),
      ...(input.description && { description: input.description }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      ...(input.ipAddress && { ipAddress: input.ipAddress }),
      ...(input.userAgent && { userAgent: input.userAgent }),
    };

    await prisma.auditLog.create({
      data,
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      error,
      input,
    });
  }
};