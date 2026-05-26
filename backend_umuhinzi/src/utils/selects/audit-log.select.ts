import type { Prisma } from "../../generated/prisma/client.js";

export const auditLogSelect = {
  id: true,
  actorId: true,
  action: true,
  resource: true,
  resourceId: true,
  description: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.AuditLogSelect;