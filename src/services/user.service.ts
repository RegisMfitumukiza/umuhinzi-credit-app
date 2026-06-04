import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { safeUserSelect } from "../utils/selects/user.select.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import {
  deleteFromCloudinary,
  getUserAvatarFolder,
  uploadBufferToCloudinary,
} from "../utils/cloudinary.helper.js";

import type { Prisma, Role } from "../generated/prisma/client.js";
import type {
  UpdateUserProfileInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "../validators/user.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type GetAllUsersOptions = {
  skip?: number;
  limit?: number;
  where?: Prisma.UserWhereInput;
  sortBy?: keyof Prisma.UserOrderByWithRelationInput;
  sortOrder?: "asc" | "desc";
};

export const getCurrentUserService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...safeUserSelect,
      farmerProfile: true,
      institutionProfile: true,
      cooperativeManagerProfile: true,
    },
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  return user;
};

export const getAllUsersService = async ({
  skip = 0,
  limit = 10,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetAllUsersOptions) => {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: safeUserSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
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

export const getUserByIdService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  return user;
};

export const updateUserProfileService = async (
  userId: string,
  input: UpdateUserProfileInput,
  context: RequestContext = {}
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingUser) {
    throw new APIError("User not found", 404);
  }

  if (input.phone) {
    const phoneExists = await prisma.user.findFirst({
      where: {
        phone: input.phone,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (phoneExists) {
      throw new APIError("Phone number already exists", 409);
    }
  }

  const updateUserData = {
    fullName: input.fullName,
    phone: input.phone,
    province: input.province,
    district: input.district,
    sector: input.sector,
    cell: input.cell,
    village: input.village,
  } satisfies Prisma.UserUpdateInput;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateUserData,
    select: safeUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "UPDATE",
    resource: "USER",
    resourceId: userId,
    description: "User profile updated",
    metadata: {
      updatedFields: Object.keys(input),
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updatedUser;
};

export const updateUserAvatarService = async (
  userId: string,
  fileBuffer: Buffer,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profileImagePublicId: true,
    },
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  const uploadedImage = await uploadBufferToCloudinary(fileBuffer, {
    folder: getUserAvatarFolder(),
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profileImageUrl: uploadedImage.url,
      profileImagePublicId: uploadedImage.publicId,
    },
    select: safeUserSelect,
  });

  if (user.profileImagePublicId) {
    await deleteFromCloudinary(user.profileImagePublicId);
  }

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "FILE_UPLOAD",
    resource: "USER",
    resourceId: userId,
    description: "User avatar updated",
    metadata: {
      publicId: uploadedImage.publicId,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updatedUser;
};

export const updateUserStatusService = async (
  userId: string,
  input: UpdateUserStatusInput,
  context: RequestContext = {}
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      isEmailVerified: true,
    },
  });

  if (!existingUser) {
    throw new APIError("User not found", 404);
  }

  if (input.status === "ACTIVE" && !existingUser.isEmailVerified) {
    throw new APIError("User email must be verified before activation.", 400);
  }

  await ensureNotLastActiveAdmin(existingUser, input.status);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: input.status,
    },
    select: safeUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "STATUS_CHANGE",
    resource: "USER",
    resourceId: userId,
    description: "User status changed",
    metadata: {
      previousStatus: existingUser.status,
      newStatus: input.status,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updatedUser;
};

export const updateUserRoleService = async (
  userId: string,
  input: UpdateUserRoleInput,
  context: RequestContext = {}
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!existingUser) {
    throw new APIError("User not found", 404);
  }

  await ensureNotLastActiveAdmin(existingUser, undefined, input.role);
  await assertRoleCompatibleWithProfiles(userId, input.role);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: input.role,
    },
    select: safeUserSelect,
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "ROLE_CHANGE",
    resource: "USER",
    resourceId: userId,
    description: "User role changed",
    metadata: {
      previousRole: existingUser.role,
      newRole: input.role,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updatedUser;
};

export const deleteUserService = async (
  userId: string,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      profileImagePublicId: true,
    },
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  await ensureNotLastActiveAdmin(user, "DEACTIVATED");

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "DEACTIVATED",
      refreshToken: null,
    },
  });

  await writeAuditLog({
    actorId: context.actorId,
    action: "STATUS_CHANGE",
    resource: "USER",
    resourceId: userId,
    description: "User deactivated",
    metadata: {
      email: user.email,
      role: user.role,
      previousStatus: user.status,
      newStatus: "DEACTIVATED",
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    message: "User deactivated successfully.",
  };
};

export const getUserStatsService = async () => {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    deactivatedUsers,
    farmers,
    institutions,
    cooperativeManagers,
    admins,
    governmentPartners,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "DEACTIVATED" } }),
    prisma.user.count({ where: { role: "FARMER" } }),
    prisma.user.count({ where: { role: "INSTITUTION" } }),
    prisma.user.count({ where: { role: "COOPERATIVE_MANAGER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "GOVERNMENT_PARTNER" } }),
  ]);

  return {
    totalUsers,
    byStatus: {
      active: activeUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
      deactivated: deactivatedUsers,
    },
    byRole: {
      farmers,
      institutions,
      cooperativeManagers,
      admins,
      governmentPartners,
    },
  };
};

const profileRoleLabels: Record<Role, string> = {
  FARMER: "farmer profile",
  INSTITUTION: "institution profile",
  COOPERATIVE_MANAGER: "cooperative manager profile",
  ADMIN: "admin access",
  GOVERNMENT_PARTNER: "government partner access",
};

const ensureNotLastActiveAdmin = async (
  user: { id: string; role: Role; status: string },
  targetStatus?: string,
  targetRole?: Role
) => {
  const willRemainActiveAdmin =
    (targetRole ?? user.role) === "ADMIN" && (targetStatus ?? user.status) === "ACTIVE";

  if (user.role !== "ADMIN" || user.status !== "ACTIVE" || willRemainActiveAdmin) {
    return;
  }

  const activeAdminCount = await prisma.user.count({
    where: { role: "ADMIN", status: "ACTIVE" },
  });

  if (activeAdminCount <= 1) {
    throw new APIError("At least one active admin account must remain.", 400);
  }
};

const assertRoleCompatibleWithProfiles = async (userId: string, nextRole: Role) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      farmerProfile: { select: { id: true } },
      institutionProfile: { select: { id: true } },
      cooperativeManagerProfile: { select: { id: true } },
    },
  });

  if (!user) throw new APIError("User not found", 404);

  const profileRoles: Role[] = [];
  if (user.farmerProfile) profileRoles.push("FARMER");
  if (user.institutionProfile) profileRoles.push("INSTITUTION");
  if (user.cooperativeManagerProfile) profileRoles.push("COOPERATIVE_MANAGER");

  const incompatibleRole = profileRoles.find((role) => role !== nextRole);
  if (incompatibleRole) {
    throw new APIError(
      `Cannot change role to ${nextRole}. This account already has a ${profileRoleLabels[incompatibleRole]}.`,
      400
    );
  }
};
