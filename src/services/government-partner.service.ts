import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { createNotification } from "../utils/notification.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateGovernmentPartnerInput,
  UpdateGovernmentPartnerStatusInput,
} from "../validators/government-partner.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const safeGovernmentPartnerSelect = {
  id: true,
  userId: true,
  organizationName: true,
  department: true,
  officialEmail: true,
  mouReference: true,
  accessPurpose: true,
  status: true,
  adminNote: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GovernmentPartnerSelect;

const governmentPartnerWithUserSelect = {
  ...safeGovernmentPartnerSelect,
  user: { select: { id: true, fullName: true, email: true, role: true } },
} satisfies Prisma.GovernmentPartnerSelect;

/* ─────────────────────────────────────────
   CREATE PROFILE (GOVERNMENT_PARTNER self-serve)
───────────────────────────────────────── */

export const createGovernmentPartnerService = async (
  userId: string,
  input: CreateGovernmentPartnerInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new APIError("User not found.", 404);
  if (user.role !== "GOVERNMENT_PARTNER") {
    throw new APIError("Only GOVERNMENT_PARTNER accounts can create a government partner profile.", 403);
  }

  const existing = await prisma.governmentPartner.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) throw new APIError("Government partner profile already exists for this user.", 409);

  const partner = await prisma.governmentPartner.create({
    data: { userId, ...input, status: "PENDING" },
    select: governmentPartnerWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "GOVERNMENT_PARTNER",
    resourceId: partner.id,
    description: "Government partner profile created — pending admin approval",
    metadata: { organizationName: partner.organizationName, department: partner.department },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify all admins about the new profile awaiting review
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "SYSTEM",
        priority: "HIGH",
        title: "New Government Partner Awaiting Review",
        message: `${partner.organizationName} (${partner.department}) has submitted a government partner profile and is awaiting approval.`,
        actionUrl: `/government-partners/${partner.id}`,
      })
    )
  );

  return partner;
};

/* ─────────────────────────────────────────
   GET MY PROFILE
───────────────────────────────────────── */

export const getMyGovernmentPartnerProfileService = async (userId: string) => {
  const partner = await prisma.governmentPartner.findUnique({
    where: { userId },
    select: governmentPartnerWithUserSelect,
  });

  if (!partner) throw new APIError("Government partner profile not found.", 404);

  return partner;
};

/* ─────────────────────────────────────────
   GET ALL (ADMIN)
───────────────────────────────────────── */

export const getGovernmentPartnersService = async (
  options: {
    skip?: number;
    limit?: number;
    status?: string;
  } = {}
) => {
  const { skip = 0, limit = 10, status } = options;

  const where: Prisma.GovernmentPartnerWhereInput = {
    ...(status && { status: status as never }),
  };

  const [partners, total] = await Promise.all([
    prisma.governmentPartner.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: governmentPartnerWithUserSelect,
    }),
    prisma.governmentPartner.count({ where }),
  ]);

  return {
    partners,
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

/* ─────────────────────────────────────────
   GET BY ID
───────────────────────────────────────── */

export const getGovernmentPartnerByIdService = async (
  partnerId: string,
  userId: string,
  userRole: string
) => {
  const partner = await prisma.governmentPartner.findUnique({
    where: { id: partnerId },
    select: governmentPartnerWithUserSelect,
  });

  if (!partner) throw new APIError("Government partner profile not found.", 404);

  if (userRole === "GOVERNMENT_PARTNER" && partner.userId !== userId) {
    throw new APIError("Not authorized to access this profile.", 403);
  }

  return partner;
};

/* ─────────────────────────────────────────
   UPDATE STATUS (ADMIN)
───────────────────────────────────────── */

export const updateGovernmentPartnerStatusService = async (
  partnerId: string,
  adminId: string,
  input: UpdateGovernmentPartnerStatusInput,
  context: RequestContext = {}
) => {
  const partner = await prisma.governmentPartner.findUnique({
    where: { id: partnerId },
    select: { id: true, status: true, userId: true },
  });

  if (!partner) throw new APIError("Government partner profile not found.", 404);

  if (input.status === "ACTIVE" && partner.status !== "PENDING") {
    throw new APIError("Only PENDING profiles can be approved.", 400);
  }
  if (input.status === "REJECTED" && partner.status !== "PENDING") {
    throw new APIError("Only PENDING profiles can be rejected.", 400);
  }

  const updated = await prisma.governmentPartner.update({
    where: { id: partnerId },
    data: { status: input.status, adminNote: input.adminNote },
    select: governmentPartnerWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? adminId,
    action: "STATUS_CHANGE",
    resource: "GOVERNMENT_PARTNER",
    resourceId: partnerId,
    description: `Government partner status changed to ${input.status}`,
    metadata: { previousStatus: partner.status, newStatus: input.status, adminNote: input.adminNote },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify the government partner about their status change
  const statusNotifications: Record<string, { title: string; message: string; priority: "HIGH" | "URGENT" }> = {
    ACTIVE: {
      title: "Government Partner Profile Approved",
      message: "Your government partner profile has been approved. You now have access to analytics and platform data.",
      priority: "HIGH",
    },
    REJECTED: {
      title: "Government Partner Profile Rejected",
      message: input.adminNote
        ? `Your government partner profile was rejected. Reason: ${input.adminNote}`
        : "Your government partner profile was not approved at this time.",
      priority: "URGENT",
    },
    REVOKED: {
      title: "Government Partner Access Revoked",
      message: input.adminNote
        ? `Your government partner access has been revoked. Reason: ${input.adminNote}`
        : "Your government partner access has been revoked by an administrator.",
      priority: "URGENT",
    },
  };

  const notif = statusNotifications[input.status];
  if (notif) {
    await createNotification({
      userId: partner.userId,
      type: "SYSTEM",
      priority: notif.priority,
      title: notif.title,
      message: notif.message,
      actionUrl: `/government-partners/me`,
    });
  }

  return updated;
};
