import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateInstitutionInput,
  UpdateInstitutionInput,
  UpdateInstitutionStatusInput,
} from "../validators/institution.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const safeInstitutionSelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  registrationNumber: true,
  licenseNumber: true,
  email: true,
  phone: true,
  address: true,
  province: true,
  district: true,
  sector: true,
  cell: true,
  village: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InstitutionSelect;

const institutionWithUserSelect = {
  ...safeInstitutionSelect,
  user: { select: { id: true, fullName: true, email: true, role: true } },
} satisfies Prisma.InstitutionSelect;

/* ─── Helpers ─── */

export const resolveInstitutionIdFromUser = async (userId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!institution) throw new APIError("Institution profile not found.", 404);
  return institution.id;
};

/* ─────────────────────────────────────────
   CREATE INSTITUTION
───────────────────────────────────────── */

export const createInstitutionService = async (
  userId: string,
  input: CreateInstitutionInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.institution.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) {
    throw new APIError("Institution profile already exists for this user.", 409);
  }

  if (input.registrationNumber) {
    const dup = await prisma.institution.findUnique({
      where: { registrationNumber: input.registrationNumber },
      select: { id: true },
    });
    if (dup) throw new APIError("Registration number already in use.", 409);
  }

  if (input.licenseNumber) {
    const dup = await prisma.institution.findUnique({
      where: { licenseNumber: input.licenseNumber },
      select: { id: true },
    });
    if (dup) throw new APIError("License number already in use.", 409);
  }

  const institution = await prisma.institution.create({
    data: { userId, ...input },
    select: institutionWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "INSTITUTION",
    resourceId: institution.id,
    description: "Institution profile created",
    metadata: { name: institution.name, type: institution.type },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return institution;
};

/* ─────────────────────────────────────────
   GET ALL INSTITUTIONS
───────────────────────────────────────── */

export const getAllInstitutionsService = async (
  options: {
    skip?: number;
    limit?: number;
    institutionUserId?: string;
    status?: Prisma.InstitutionWhereInput["status"];
  } = {}
) => {
  const { skip = 0, limit = 10, institutionUserId, status } = options;

  const where: Prisma.InstitutionWhereInput = institutionUserId
    ? { userId: institutionUserId }
    : {};

  if (status) {
    where.status = status;
  }

  const [institutions, total] = await Promise.all([
    prisma.institution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: institutionWithUserSelect,
    }),
    prisma.institution.count({ where }),
  ]);

  return {
    institutions,
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
   GET INSTITUTION BY ID
───────────────────────────────────────── */

export const getInstitutionByIdService = async (
  institutionId: string,
  userId: string,
  userRole: string
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: institutionWithUserSelect,
  });

  if (!institution) throw new APIError("Institution not found.", 404);

  if (userRole === "INSTITUTION" && institution.userId !== userId) {
    throw new APIError("Not authorized to access this institution.", 403);
  }

  return institution;
};

/* ─────────────────────────────────────────
   UPDATE INSTITUTION
───────────────────────────────────────── */

export const updateInstitutionService = async (
  institutionId: string,
  userId: string,
  userRole: string,
  input: UpdateInstitutionInput,
  context: RequestContext = {}
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, userId: true },
  });

  if (!institution) throw new APIError("Institution not found.", 404);

  if (userRole === "INSTITUTION" && institution.userId !== userId) {
    throw new APIError("Not authorized to update this institution.", 403);
  }

  if (input.registrationNumber) {
    const dup = await prisma.institution.findFirst({
      where: { registrationNumber: input.registrationNumber, id: { not: institutionId } },
      select: { id: true },
    });
    if (dup) throw new APIError("Registration number already in use.", 409);
  }

  if (input.licenseNumber) {
    const dup = await prisma.institution.findFirst({
      where: { licenseNumber: input.licenseNumber, id: { not: institutionId } },
      select: { id: true },
    });
    if (dup) throw new APIError("License number already in use.", 409);
  }

  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data: input,
    select: institutionWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "INSTITUTION",
    resourceId: institutionId,
    description: "Institution profile updated",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─────────────────────────────────────────
   UPDATE INSTITUTION STATUS (ADMIN)
───────────────────────────────────────── */

export const updateInstitutionStatusService = async (
  institutionId: string,
  userId: string,
  input: UpdateInstitutionStatusInput,
  context: RequestContext = {}
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, status: true },
  });

  if (!institution) throw new APIError("Institution not found.", 404);

  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data: { status: input.status },
    select: institutionWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "INSTITUTION",
    resourceId: institutionId,
    description: `Institution status changed to ${input.status}`,
    metadata: { previousStatus: institution.status, newStatus: input.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─────────────────────────────────────────
   DELETE INSTITUTION (ADMIN — soft delete via status)
───────────────────────────────────────── */

export const deleteInstitutionService = async (
  institutionId: string,
  userId: string,
  context: RequestContext = {}
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true },
  });

  if (!institution) throw new APIError("Institution not found.", 404);

  await prisma.institution.update({
    where: { id: institutionId },
    data: { status: "DEACTIVATED" },
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "INSTITUTION",
    resourceId: institutionId,
    description: "Institution soft-deleted (status set to DEACTIVATED)",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Institution deactivated successfully." };
};
