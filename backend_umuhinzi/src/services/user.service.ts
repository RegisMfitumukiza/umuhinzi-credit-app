import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { safeUserSelect } from "../utils/selects/user.select.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import {
  deleteFromCloudinary,
  getUserAvatarFolder,
  uploadBufferToCloudinary,
} from "../utils/cloudinary.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
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
      status: true,
    },
  });

  if (!existingUser) {
    throw new APIError("User not found", 404);
  }

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
    },
  });

  if (!existingUser) {
    throw new APIError("User not found", 404);
  }

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
      profileImagePublicId: true,
    },
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  // Clean up related records that do not have onDelete: Cascade in the schema.
  // - Remove audit logs generated by this user
  // - Remove analytics reports generated by this user
  // - Null out reviewer/changedBy references on loan entities so history is preserved
  // Finally delete the user (this will cascade-delete related farmer/institution/cooperative records
  // for relations that have onDelete: Cascade defined in the Prisma schema).
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { actorId: userId } }),
    prisma.analyticsReport.deleteMany({ where: { generatedById: userId } }),
    prisma.loanApplication.updateMany({ where: { reviewedById: userId }, data: { reviewedById: null } }),
    prisma.loanStatusHistory.updateMany({ where: { changedById: userId }, data: { changedById: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Remove user's profile image from Cloudinary if present
  if (user.profileImagePublicId) {
    await deleteFromCloudinary(user.profileImagePublicId);
  }

  await writeAuditLog({
    actorId: context.actorId,
    action: "DELETE",
    resource: "USER",
    resourceId: userId,
    description: "User deleted",
    metadata: {
      email: user.email,
      role: user.role,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    message: "User deleted successfully.",
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