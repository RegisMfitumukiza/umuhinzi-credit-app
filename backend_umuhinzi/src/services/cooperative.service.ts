import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateCooperativeInput,
  UpdateCooperativeInput,
  AddCooperativeMemberInput,
  UpdateCooperativeMemberInput,
} from "../validators/cooperative.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const safeCooperativeSelect = {
  id: true,
  name: true,
  registrationNumber: true,
  description: true,
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
} satisfies Prisma.CooperativeSelect;

const cooperativeWithCountsSelect = {
  ...safeCooperativeSelect,
  _count: { select: { members: true, managers: true } },
} satisfies Prisma.CooperativeSelect;

const safeMemberSelect = {
  id: true,
  cooperativeId: true,
  farmerId: true,
  status: true,
  joinedAt: true,
  leftAt: true,
  createdAt: true,
  updatedAt: true,
  farmer: {
    select: {
      id: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
} satisfies Prisma.CooperativeMemberSelect;

/* ─── Helpers ─── */

const resolveCooperativeManagerId = async (userId: string) => {
  const manager = await prisma.cooperativeManager.findUnique({
    where: { userId },
    select: { id: true, cooperativeId: true },
  });
  if (!manager) throw new APIError("Cooperative manager profile not found.", 404);
  return manager;
};

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer profile not found.", 404);
  return farmer.id;
};

/* ─────────────────────────────────────────
   CREATE COOPERATIVE
───────────────────────────────────────── */

export const createCooperativeService = async (
  userId: string,
  input: CreateCooperativeInput,
  context: RequestContext = {}
) => {
  if (input.registrationNumber) {
    const dup = await prisma.cooperative.findUnique({
      where: { registrationNumber: input.registrationNumber },
      select: { id: true },
    });
    if (dup) throw new APIError("Registration number already in use.", 409);
  }

  const cooperative = await prisma.$transaction(async (tx) => {
    const created = await tx.cooperative.create({
      data: { ...input, status: "PENDING" },
      select: safeCooperativeSelect,
    });

    // Auto-create manager record for the creating user
    await tx.cooperativeManager.create({
      data: {
        userId,
        cooperativeId: created.id,
        position: "Manager",
      },
    });

    return created;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "COOPERATIVE",
    resourceId: cooperative.id,
    description: "Cooperative created",
    metadata: { name: cooperative.name },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return cooperative;
};

/* ─────────────────────────────────────────
   GET ALL COOPERATIVES
───────────────────────────────────────── */

export const getAllCooperativesService = async (
  options: { skip?: number; limit?: number } = {}
) => {
  const { skip = 0, limit = 10 } = options;

  const [cooperatives, total] = await Promise.all([
    prisma.cooperative.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: cooperativeWithCountsSelect,
    }),
    prisma.cooperative.count(),
  ]);

  return {
    cooperatives,
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
   GET COOPERATIVE BY ID
───────────────────────────────────────── */

export const getCooperativeByIdService = async (cooperativeId: string) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: cooperativeWithCountsSelect,
  });

  if (!cooperative) throw new APIError("Cooperative not found.", 404);
  return cooperative;
};

/* ─────────────────────────────────────────
   UPDATE COOPERATIVE
───────────────────────────────────────── */

export const updateCooperativeService = async (
  cooperativeId: string,
  userId: string,
  userRole: string,
  input: UpdateCooperativeInput,
  context: RequestContext = {}
) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true },
  });
  if (!cooperative) throw new APIError("Cooperative not found.", 404);

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    if (manager.cooperativeId !== cooperativeId) {
      throw new APIError("Not authorized to update this cooperative.", 403);
    }
  }

  if (input.registrationNumber) {
    const dup = await prisma.cooperative.findFirst({
      where: { registrationNumber: input.registrationNumber, id: { not: cooperativeId } },
      select: { id: true },
    });
    if (dup) throw new APIError("Registration number already in use.", 409);
  }

  const updated = await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: input,
    select: cooperativeWithCountsSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: "Cooperative updated",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─────────────────────────────────────────
   DELETE COOPERATIVE (ADMIN)
───────────────────────────────────────── */

export const deleteCooperativeService = async (
  cooperativeId: string,
  userId: string,
  context: RequestContext = {}
) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true },
  });
  if (!cooperative) throw new APIError("Cooperative not found.", 404);

  await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: { status: "DEACTIVATED" },
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: "Cooperative soft-deleted (status set to DEACTIVATED)",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Cooperative deactivated successfully." };
};

/* ─────────────────────────────────────────
   ADD COOPERATIVE MEMBER (FARMER JOINS)
───────────────────────────────────────── */

export const addCooperativeMemberService = async (
  userId: string,
  input: AddCooperativeMemberInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const cooperative = await prisma.cooperative.findUnique({
    where: { id: input.cooperativeId },
    select: { id: true, status: true },
  });
  if (!cooperative) throw new APIError("Cooperative not found.", 404);
  if (cooperative.status !== "ACTIVE") {
    throw new APIError("Cooperative is not currently active. It may be pending admin approval.", 400);
  }

  const existing = await prisma.cooperativeMember.findUnique({
    where: { farmerId },
    select: { id: true, status: true },
  });
  if (existing && existing.status === "ACTIVE") {
    throw new APIError("Farmer is already an active member of a cooperative.", 409);
  }

  const member = existing
    ? await prisma.cooperativeMember.update({
        where: { id: existing.id },
        data: {
          cooperativeId: input.cooperativeId,
          status: "PENDING",
          joinedAt: input.joinedAt ?? new Date(),
          leftAt: null,
        },
        select: safeMemberSelect,
      })
    : await prisma.cooperativeMember.create({
        data: {
          cooperativeId: input.cooperativeId,
          farmerId,
          status: "PENDING",
          joinedAt: input.joinedAt ?? new Date(),
        },
        select: safeMemberSelect,
      });

  await prisma.farmer.update({
    where: { id: farmerId },
    data: {
      cooperativeId: input.cooperativeId,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "COOPERATIVE",
    resourceId: input.cooperativeId,
    description: "Farmer joined cooperative",
    metadata: { farmerId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return member;
};

/* ─────────────────────────────────────────
   UPDATE COOPERATIVE MEMBER
───────────────────────────────────────── */

export const updateCooperativeMemberService = async (
  memberId: string,
  userId: string,
  userRole: string,
  input: UpdateCooperativeMemberInput,
  context: RequestContext = {}
) => {
  const member = await prisma.cooperativeMember.findUnique({
    where: { id: memberId },
    select: { id: true, cooperativeId: true, status: true, joinedAt: true, farmerId: true },
  });
  if (!member) throw new APIError("Cooperative member not found.", 404);

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    if (manager.cooperativeId !== member.cooperativeId) {
      throw new APIError("Not authorized to update members in this cooperative.", 403);
    }
  }

  const updated = await prisma.cooperativeMember.update({
    where: { id: memberId },
    data: {
      status: input.status ?? member.status,
      joinedAt:
        input.joinedAt ??
        (input.status === "ACTIVE" && !member.joinedAt ? new Date() : undefined),
      leftAt: input.leftAt ?? (input.status === "LEFT" || input.status === "REMOVED" ? new Date() : undefined),
    },
    select: safeMemberSelect,
  });

  if (updated.status === "ACTIVE") {
    await prisma.farmer.update({
      where: { id: updated.farmerId },
      data: {
        cooperativeId: updated.cooperativeId,
        status: "VERIFIED",
      },
    });
  }

  if (updated.status === "REMOVED" || updated.status === "LEFT") {
    await prisma.farmer.update({
      where: { id: updated.farmerId },
      data: {
        status: "PENDING",
      },
    });
  }

  if (updated.status === "ACTIVE") {
    await prisma.farmer.update({
      where: { id: member.farmerId },
      data: {
        cooperativeId: member.cooperativeId,
        status: "VERIFIED",
      },
    });
  }

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "COOPERATIVE",
    resourceId: member.cooperativeId,
    description: "Cooperative member updated",
    metadata: { memberId, status: updated.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

/* ─────────────────────────────────────────
   GET COOPERATIVE MEMBERS
───────────────────────────────────────── */

export const getCooperativeMembersService = async (
  userId: string,
  userRole: string,
  options: { skip?: number; limit?: number; cooperativeId?: string } = {}
) => {
  const { skip = 0, limit = 10, cooperativeId } = options;

  let where: Prisma.CooperativeMemberWhereInput = {};

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    where = { cooperativeId: manager.cooperativeId };
  } else if (cooperativeId) {
    where = { cooperativeId };
  }

  const [members, total] = await Promise.all([
    prisma.cooperativeMember.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeMemberSelect,
    }),
    prisma.cooperativeMember.count({ where }),
  ]);

  return {
    members,
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
   REMOVE COOPERATIVE MEMBER
───────────────────────────────────────── */

export const removeCooperativeMemberService = async (
  memberId: string,
  userId: string,
  userRole: string,
  context: RequestContext = {}
) => {
  const member = await prisma.cooperativeMember.findUnique({
    where: { id: memberId },
    select: { id: true, cooperativeId: true, farmerId: true },
  });
  if (!member) throw new APIError("Cooperative member not found.", 404);

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    if (manager.cooperativeId !== member.cooperativeId) {
      throw new APIError("Not authorized to remove members from this cooperative.", 403);
    }
  }

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (member.farmerId !== farmerId) {
      throw new APIError("Not authorized to remove this member.", 403);
    }
  }

  await prisma.cooperativeMember.update({
    where: { id: memberId },
    data: { status: "REMOVED", leftAt: new Date() },
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "COOPERATIVE",
    resourceId: member.cooperativeId,
    description: "Cooperative member removed",
    metadata: { memberId, farmerId: member.farmerId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Member removed from cooperative successfully." };
};

/* ─────────────────────────────────────────
   UPDATE COOPERATIVE STATUS (ADMIN)
───────────────────────────────────────── */

export const updateCooperativeStatusService = async (
  cooperativeId: string,
  userId: string,
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED",
  context: RequestContext = {}
) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true, status: true },
  });
  if (!cooperative) throw new APIError("Cooperative not found.", 404);

  const updated = await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: { status },
    select: safeCooperativeSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: `Cooperative status changed to ${status}`,
    metadata: { previousStatus: cooperative.status, newStatus: status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};
