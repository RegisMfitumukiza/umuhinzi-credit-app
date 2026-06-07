import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { notifyAdminInstitutionRegistered } from "../utils/notification.helper.js";

import type { InstitutionType, Prisma } from "../generated/prisma/client.js";
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

const REGULATED_INSTITUTION_TYPES: InstitutionType[] = [
  "SACCO",
  "MICROFINANCE",
  "BANK",
];

const requiresRegulatoryCredentials = (type: InstitutionType) =>
  REGULATED_INSTITUTION_TYPES.includes(type);

const assertInstitutionActivationReady = (institution: {
  type: InstitutionType;
  registrationNumber: string | null;
  licenseNumber: string | null;
  district: string | null;
}) => {
  if (requiresRegulatoryCredentials(institution.type)) {
    if (!institution.registrationNumber || !institution.licenseNumber) {
      throw new APIError(
        "Regulated institutions require registration and license numbers before activation.",
        400
      );
    }
  }

  if (!institution.district) {
    throw new APIError("Institution district is required before activation.", 400);
  }
};

const CRITICAL_INSTITUTION_FIELDS: (keyof UpdateInstitutionInput)[] = [
  "name",
  "type",
  "registrationNumber",
  "licenseNumber",
  "email",
  "phone",
  "address",
  "province",
  "district",
];

const hasCriticalInstitutionChanges = (input: UpdateInstitutionInput) =>
  CRITICAL_INSTITUTION_FIELDS.some((field) => field in input);

/* ─────────────────────────────────────────
   CREATE INSTITUTION
───────────────────────────────────────── */

export const createInstitutionService = async (
  userId: string,
  input: CreateInstitutionInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new APIError("User not found.", 404);
  if (user.role !== "INSTITUTION") {
    throw new APIError("Only INSTITUTION accounts can create institution profiles.", 403);
  }

  if (
    requiresRegulatoryCredentials(input.type) &&
    (!input.registrationNumber || !input.licenseNumber)
  ) {
    throw new APIError(
      "Regulated institutions require registration and license numbers.",
      400
    );
  }

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
    data: { userId, ...input, status: "PENDING" },
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

  await notifyAdminInstitutionRegistered(institution.name);

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
  } = {}
) => {
  const { skip = 0, limit = 10, institutionUserId } = options;

  const where: Prisma.InstitutionWhereInput = institutionUserId
    ? { userId: institutionUserId }
    : {};

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
    select: { id: true, userId: true, status: true },
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

  const shouldReturnToPending =
    userRole === "INSTITUTION" &&
    institution.status === "ACTIVE" &&
    hasCriticalInstitutionChanges(input);

  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data: {
      ...input,
      ...(shouldReturnToPending && { status: "PENDING" as const }),
    },
    select: institutionWithUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "INSTITUTION",
    resourceId: institutionId,
    description: shouldReturnToPending
      ? "Institution profile updated and returned to pending review"
      : "Institution profile updated",
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
    select: {
      id: true,
      status: true,
      type: true,
      registrationNumber: true,
      licenseNumber: true,
      district: true,
    },
  });

  if (!institution) throw new APIError("Institution not found.", 404);

  if (input.status === "ACTIVE") {
    assertInstitutionActivationReady(institution);
  }

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
