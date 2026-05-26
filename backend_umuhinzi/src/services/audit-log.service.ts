import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";
import { auditLogSelect } from "../utils/selects/audit-log.select.js";
import type { CreateAuditLogInput } from "../validators/audit-log.schema.js";

export const createAuditLogService = async (input: CreateAuditLogInput) => {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: input.action,
    resource: input.resource,
    ...(input.actorId && { actorId: input.actorId }),
    ...(input.resourceId && { resourceId: input.resourceId }),
    ...(input.description && { description: input.description }),
    ...(input.metadata !== undefined && {
      metadata: input.metadata as Prisma.InputJsonValue,
    }),
    ...(input.ipAddress && { ipAddress: input.ipAddress }),
    ...(input.userAgent && { userAgent: input.userAgent }),
  };

  return prisma.auditLog.create({
    data,
    select: auditLogSelect,
  });
};

export const getAuditLogsService = async ({
  skip = 0,
  limit = 10,
  where = {},
}: {
  skip?: number;
  limit?: number;
  where?: Prisma.AuditLogWhereInput;
}) => {
  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: auditLogSelect,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    auditLogs,
    pagination: {
      total,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasNextPage: skip + limit < total,
      hasPreviousPage: skip > 0,
    },
  };
};