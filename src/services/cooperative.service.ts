import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import {
  notifyAdminCooperativeSubmitted,
  notifyCooperativeManagerStatusChanged,
  notifyCooperativeManagerMemberJoined,
  notifyCooperativeManagerMemberLeft,
  notifyFarmerJoinedCooperative,
} from "../utils/notification.helper.js";

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
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CooperativeSelect;

const cooperativeWithCountsSelect = {
  ...safeCooperativeSelect,
  _count: { select: { members: true, managers: true } },
} satisfies Prisma.CooperativeSelect;

const cooperativeDiscoverySelect = {
  id: true,
  name: true,
  description: true,
  district: true,
  province: true,
  sector: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  _count: { select: { members: true } },
} satisfies Prisma.CooperativeSelect;

const pendingCooperativeSelect = {
  ...safeCooperativeSelect,
  _count: { select: { members: true, managers: true } },
  managers: {
    take: 1,
    select: {
      position: true,
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
  },
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
      user: { select: { id: true, fullName: true, email: true, phone: true } },
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

const assertCooperativeCanAcceptMembers = async (cooperativeId: string) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true, status: true },
  });

  if (!cooperative) throw new APIError("Cooperative not found.", 404);
  if (cooperative.status !== "ACTIVE") {
    throw new APIError("Cooperative must be active before it can accept members.", 400);
  }

  return cooperative;
};

const assertCooperativeActivationReady = (cooperative: {
  district: string | null;
  phone: string | null;
  email: string | null;
}) => {
  if (!cooperative.district) {
    throw new APIError("District is required before cooperative activation.", 400);
  }

  if (!cooperative.phone && !cooperative.email) {
    throw new APIError("At least one cooperative contact method is required before activation.", 400);
  }
};

const cooperativeIdentityChanged = (input: UpdateCooperativeInput) =>
  ["name", "registrationNumber"].some((field) => field in input);

/* ─────────────────────────────────────────
   GET MY COOPERATIVE (MANAGER)
───────────────────────────────────────── */

export const getMyCooperativeService = async (userId: string) => {
  const manager = await prisma.cooperativeManager.findUnique({
    where: { userId },
    select: { cooperativeId: true },
  });

  if (!manager) return null;

  return prisma.cooperative.findUnique({
    where: { id: manager.cooperativeId },
    select: cooperativeWithCountsSelect,
  });
};

/* ─────────────────────────────────────────
   CREATE COOPERATIVE
───────────────────────────────────────── */

export const createCooperativeService = async (
  userId: string,
  input: CreateCooperativeInput,
  context: RequestContext = {}
) => {
  const existingManager = await prisma.cooperativeManager.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existingManager) {
    throw new APIError("This account already manages a cooperative.", 409);
  }

  const dup = await prisma.cooperative.findUnique({
    where: { registrationNumber: input.registrationNumber },
    select: { id: true },
  });
  if (dup) throw new APIError("Registration number already in use.", 409);

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

  await notifyAdminCooperativeSubmitted(cooperative.name);

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
    select: { id: true, status: true },
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

  // REJECTED → PENDING on any manager edit (manager fixing issues after rejection)
  // ACTIVE → PENDING only when identity fields (name/registrationNumber) change
  const shouldReturnToPending =
    userRole === "COOPERATIVE_MANAGER" &&
    (cooperative.status === "REJECTED" ||
      (cooperative.status === "ACTIVE" && cooperativeIdentityChanged(input)));

  const updated = await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: {
      ...input,
      ...(shouldReturnToPending && {
        status: "PENDING" as const,
        rejectionReason: null,
      }),
    },
    select: cooperativeWithCountsSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: shouldReturnToPending
      ? "Cooperative updated and returned to pending review"
      : "Cooperative updated",
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
  userRole: string,
  input: AddCooperativeMemberInput,
  context: RequestContext = {}
) => {
  let cooperativeId = input.cooperativeId;
  let farmerId: string;

  if (userRole === "FARMER") {
    farmerId = await resolveFarmerIdFromUser(userId);
  } else if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    cooperativeId = manager.cooperativeId;
    if (!input.farmerId) {
      throw new APIError("farmerId is required when a cooperative manager adds a member.", 400);
    }
    farmerId = input.farmerId;
  } else if (userRole === "ADMIN") {
    if (!input.farmerId) {
      throw new APIError("farmerId is required when admin adds a member.", 400);
    }
    farmerId = input.farmerId;
  } else {
    throw new APIError("Not authorized to manage cooperative members.", 403);
  }

  await assertCooperativeCanAcceptMembers(cooperativeId);

  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true, status: true },
  });
  if (!farmer) throw new APIError("Farmer not found.", 404);
  if (farmer.status === "SUSPENDED") {
    throw new APIError("Suspended farmers cannot join cooperatives.", 403);
  }

  const existing = await prisma.cooperativeMember.findUnique({
    where: { farmerId },
    select: { id: true, status: true },
  });
  if (existing && ["ACTIVE", "PENDING"].includes(existing.status)) {
    throw new APIError("Farmer already has an active or pending cooperative membership.", 409);
  }

  const requestedStatus =
    userRole === "FARMER" ? "PENDING" : input.status ?? "ACTIVE";

  const member = await prisma.$transaction(async (tx) => {
    const data = {
      cooperative: { connect: { id: cooperativeId } },
      status: requestedStatus,
      joinedAt: requestedStatus === "ACTIVE" ? input.joinedAt ?? new Date() : null,
      leftAt: null,
    } satisfies Prisma.CooperativeMemberUpdateInput;

    const membership = existing
      ? await tx.cooperativeMember.update({
          where: { id: existing.id },
          data,
          select: safeMemberSelect,
        })
      : await tx.cooperativeMember.create({
          data: {
            cooperativeId,
            farmerId,
            status: requestedStatus,
            joinedAt:
              requestedStatus === "ACTIVE" ? input.joinedAt ?? new Date() : null,
          },
          select: safeMemberSelect,
        });

    if (requestedStatus === "ACTIVE") {
      await tx.farmer.update({
        where: { id: farmerId },
        data: { cooperativeId },
      });
    }

    return membership;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description:
      requestedStatus === "PENDING"
        ? "Cooperative membership requested"
        : "Cooperative member added",
    metadata: { farmerId, status: requestedStatus },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify cooperative manager and farmer
  const coopInfo = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: {
      name: true,
      managers: { take: 1, select: { user: { select: { id: true } } } },
    },
  });
  if (coopInfo) {
    const managerUserId = coopInfo.managers[0]?.user?.id;
    const farmerName = member.farmer.user.fullName;
    if (managerUserId) {
      await notifyCooperativeManagerMemberJoined(managerUserId, farmerName, coopInfo.name);
    }
    if (userRole === "FARMER") {
      await notifyFarmerJoinedCooperative(member.farmer.user.id, coopInfo.name);
    }
  }

  return member;
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

export const updateCooperativeMemberService = async (
  memberId: string,
  userId: string,
  userRole: string,
  input: UpdateCooperativeMemberInput,
  context: RequestContext = {}
) => {
  const member = await prisma.cooperativeMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      cooperativeId: true,
      farmerId: true,
      status: true,
    },
  });

  if (!member) throw new APIError("Cooperative member not found.", 404);

  if (userRole === "COOPERATIVE_MANAGER") {
    const manager = await resolveCooperativeManagerId(userId);
    if (manager.cooperativeId !== member.cooperativeId) {
      throw new APIError("Not authorized to update this cooperative member.", 403);
    }
  } else if (userRole !== "ADMIN") {
    throw new APIError("Not authorized to update cooperative members.", 403);
  }

  const nextStatus = input.status ?? member.status;

  if (nextStatus === "ACTIVE") {
    await assertCooperativeCanAcceptMembers(member.cooperativeId);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cooperativeMember.update({
      where: { id: memberId },
      data: {
        status: nextStatus,
        joinedAt:
          nextStatus === "ACTIVE"
            ? input.joinedAt ?? new Date()
            : input.joinedAt,
        leftAt:
          nextStatus === "LEFT" || nextStatus === "REMOVED"
            ? input.leftAt ?? new Date()
            : input.leftAt,
      },
      select: safeMemberSelect,
    });

    if (nextStatus === "ACTIVE") {
      await tx.farmer.update({
        where: { id: member.farmerId },
        data: { cooperativeId: member.cooperativeId },
      });
    }

    if (nextStatus === "LEFT" || nextStatus === "REMOVED") {
      await tx.farmer.updateMany({
        where: { id: member.farmerId, cooperativeId: member.cooperativeId },
        data: { cooperativeId: null },
      });
    }

    return result;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "COOPERATIVE",
    resourceId: member.cooperativeId,
    description: `Cooperative member status changed to ${nextStatus}`,
    metadata: {
      memberId,
      farmerId: member.farmerId,
      previousStatus: member.status,
      newStatus: nextStatus,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

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

  const nextStatus = userRole === "FARMER" ? "LEFT" : "REMOVED";

  await prisma.$transaction(async (tx) => {
    await tx.cooperativeMember.update({
      where: { id: memberId },
      data: { status: nextStatus, leftAt: new Date() },
    });

    await tx.farmer.updateMany({
      where: { id: member.farmerId, cooperativeId: member.cooperativeId },
      data: { cooperativeId: null },
    });
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "COOPERATIVE",
    resourceId: member.cooperativeId,
    description:
      nextStatus === "LEFT"
        ? "Farmer left cooperative"
        : "Cooperative member removed",
    metadata: { memberId, farmerId: member.farmerId, status: nextStatus },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify cooperative manager that a member left/was removed
  const coopInfo = await prisma.cooperative.findUnique({
    where: { id: member.cooperativeId },
    select: {
      name: true,
      managers: { take: 1, select: { user: { select: { id: true } } } },
    },
  });
  const farmer = await prisma.farmer.findUnique({
    where: { id: member.farmerId },
    select: { user: { select: { id: true, fullName: true } } },
  });
  if (coopInfo && farmer) {
    const managerUserId = coopInfo.managers[0]?.user?.id;
    if (managerUserId) {
      await notifyCooperativeManagerMemberLeft(managerUserId, farmer.user.fullName, coopInfo.name);
    }
  }

  return { message: "Member removed from cooperative successfully." };
};

/* ─────────────────────────────────────────
   UPDATE COOPERATIVE STATUS (ADMIN)
───────────────────────────────────────── */

export const updateCooperativeStatusService = async (
  cooperativeId: string,
  userId: string,
  input: { status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "DEACTIVATED"; rejectionReason?: string },
  context: RequestContext = {}
) => {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: {
      id: true,
      status: true,
      district: true,
      phone: true,
      email: true,
    },
  });
  if (!cooperative) throw new APIError("Cooperative not found.", 404);

  const { status, rejectionReason } = input;

  if (status === "ACTIVE") {
    assertCooperativeActivationReady(cooperative);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cooperative.update({
      where: { id: cooperativeId },
      data: {
        status,
        ...(status === "REJECTED" && { rejectionReason }),
        ...(status === "ACTIVE" && { rejectionReason: null }),
      },
      select: safeCooperativeSelect,
    });

    if (status === "DEACTIVATED") {
      await tx.cooperativeMember.updateMany({
        where: { cooperativeId, status: "ACTIVE" },
        data: { status: "REMOVED", leftAt: new Date() },
      });
      await tx.farmer.updateMany({
        where: { cooperativeId },
        data: { cooperativeId: null },
      });
    }

    return result;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: `Cooperative status changed to ${status}`,
    metadata: {
      previousStatus: cooperative.status,
      newStatus: status,
      ...(rejectionReason && { rejectionReason }),
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify cooperative manager about the status change (ACTIVE, REJECTED, SUSPENDED)
  if (["ACTIVE", "REJECTED", "SUSPENDED"].includes(status)) {
    const manager = await prisma.cooperativeManager.findFirst({
      where: { cooperativeId },
      select: { user: { select: { id: true } } },
    });
    if (manager?.user?.id) {
      await notifyCooperativeManagerStatusChanged(
        manager.user.id,
        updated.name,
        status,
        rejectionReason
      );
    }
  }

  return updated;
};

/* ─────────────────────────────────────────
   DISCOVER COOPERATIVES (FARMER)
───────────────────────────────────────── */

export const discoverCooperativesService = async (
  userId: string,
  options: {
    scope?: "district" | "province" | "national";
    skip?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  const { scope = "district", skip = 0, limit = 10, search } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { district: true, province: true },
  });
  if (!user) throw new APIError("User not found", 404);

  let locationFilter: Prisma.CooperativeWhereInput = {};

  if (scope === "district") {
    if (!user.district) {
      throw new APIError(
        "Your district is not set on your profile. Update your profile or use scope=national to browse all cooperatives.",
        400
      );
    }
    locationFilter = { district: { equals: user.district, mode: "insensitive" } };
  } else if (scope === "province") {
    if (!user.province) {
      throw new APIError(
        "Your province is not set on your profile. Update your profile or use scope=national to browse all cooperatives.",
        400
      );
    }
    locationFilter = { province: { equals: user.province, mode: "insensitive" } };
  }

  const where: Prisma.CooperativeWhereInput = {
    status: "ACTIVE",
    ...locationFilter,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };

  const [cooperatives, total] = await Promise.all([
    prisma.cooperative.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: cooperativeDiscoverySelect,
    }),
    prisma.cooperative.count({ where }),
  ]);

  return {
    cooperatives,
    scope,
    userLocation: { district: user.district, province: user.province },
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
   PENDING COOPERATIVES QUEUE (ADMIN)
───────────────────────────────────────── */

export const getPendingCooperativesService = async (
  options: { skip?: number; limit?: number } = {}
) => {
  const { skip = 0, limit = 10 } = options;

  const [cooperatives, total] = await Promise.all([
    prisma.cooperative.findMany({
      where: { status: "PENDING" },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      select: pendingCooperativeSelect,
    }),
    prisma.cooperative.count({ where: { status: "PENDING" } }),
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
