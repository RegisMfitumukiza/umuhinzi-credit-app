import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateLivestockInput,
  UpdateLivestockInput,
} from "../validators/livestock.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── selects ─── */

const safeLivestockSelect = {
  id: true,
  farmerId: true,
  type: true,
  purpose: true,
  quantity: true,
  estimatedValue: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LivestockSelect;

const livestockWithFarmerSelect = {
  id: true,
  farmerId: true,
  type: true,
  purpose: true,
  quantity: true,
  estimatedValue: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  farmer: {
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.LivestockSelect;

/* ─── helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!farmer) {
    throw new APIError(
      "Farmer profile not found. Please create your farmer profile first.",
      404
    );
  }

  return farmer.id;
};

const assertLivestockOwnership = async (
  livestockId: string,
  farmerId: string
) => {
  const livestock = await prisma.livestock.findUnique({
    where: { id: livestockId },
    select: { id: true, farmerId: true },
  });

  if (!livestock) {
    throw new APIError("Livestock record not found", 404);
  }

  if (livestock.farmerId !== farmerId) {
    throw new APIError(
      "You are not authorized to access this livestock record",
      403
    );
  }

  return livestock;
};

/* ─── create ─── */

export const createLivestockService = async (
  userId: string,
  input: CreateLivestockInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const livestock = await prisma.livestock.create({
    data: {
      farmerId,
      type: input.type,
      purpose: input.purpose ?? "COMMERCIAL",
      quantity: input.quantity ?? 1,
      estimatedValue: input.estimatedValue,
      notes: input.notes,
    },
    select: safeLivestockSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "FARMER",
    resourceId: livestock.id,
    description: "Livestock record created",
    metadata: { type: livestock.type, quantity: livestock.quantity },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return livestock;
};

/* ─── get my livestock ─── */

export const getMyLivestockService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const { skip = 0, limit = 10 } = options;

  const where: Prisma.LivestockWhereInput = { farmerId };

  const [livestock, total] = await Promise.all([
    prisma.livestock.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeLivestockSelect,
    }),
    prisma.livestock.count({ where }),
  ]);

  return {
    livestock,
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

/* ─── get all livestock (admin) ─── */

export const getAllLivestockService = async (options: {
  skip?: number;
  limit?: number;
  where?: Prisma.LivestockWhereInput;
} = {}) => {
  const { skip = 0, limit = 10, where = {} } = options;

  const [livestock, total] = await Promise.all([
    prisma.livestock.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: livestockWithFarmerSelect,
    }),
    prisma.livestock.count({ where }),
  ]);

  return {
    livestock,
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

/* ─── get by ID ─── */

export const getLivestockByIdService = async (
  livestockId: string,
  userId?: string,
  isAdmin = false
) => {
  const livestock = await prisma.livestock.findUnique({
    where: { id: livestockId },
    select: livestockWithFarmerSelect,
  });

  if (!livestock) {
    throw new APIError("Livestock record not found", 404);
  }

  if (!isAdmin && userId) {
    const farmerId = await resolveFarmerIdFromUser(userId);

    if (livestock.farmerId !== farmerId) {
      throw new APIError(
        "You are not authorized to access this livestock record",
        403
      );
    }
  }

  return livestock;
};

/* ─── update ─── */

export const updateLivestockService = async (
  livestockId: string,
  userId: string,
  input: UpdateLivestockInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  await assertLivestockOwnership(livestockId, farmerId);

  const updated = await prisma.livestock.update({
    where: { id: livestockId },
    data: {
      type: input.type,
      purpose: input.purpose,
      quantity: input.quantity,
      estimatedValue: input.estimatedValue,
      notes: input.notes,
      status: input.status,
    },
    select: safeLivestockSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "FARMER",
    resourceId: livestockId,
    description: "Livestock record updated",
    metadata: { updatedFields: Object.keys(input) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─── delete ─── */

export const deleteLivestockService = async (
  livestockId: string,
  userId: string,
  isAdmin = false,
  context: RequestContext = {}
) => {
  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    await assertLivestockOwnership(livestockId, farmerId);
  } else {
    const livestock = await prisma.livestock.findUnique({
      where: { id: livestockId },
      select: { id: true },
    });
    if (!livestock) throw new APIError("Livestock record not found", 404);
  }

  await prisma.livestock.delete({ where: { id: livestockId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "FARMER",
    resourceId: livestockId,
    description: "Livestock record deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Livestock record deleted successfully." };
};
