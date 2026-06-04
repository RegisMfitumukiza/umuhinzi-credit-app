import type { Request, Response } from "express";
import { Role, UserStatus, type Prisma } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { getPagination } from "../utils/pagination.js";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { provisionedAccountTemplate } from "../templates/auth-email.template.js";
import { safeUserSelect } from "../utils/selects/user.select.js";
import { writeAuditLog } from "../utils/audit.helper.js";

import {
  deleteUserService,
  getAllUsersService,
  getCurrentUserService,
  getUserByIdService,
  getUserStatsService,
  updateUserAvatarService,
  updateUserProfileService,
  updateUserRoleService,
  updateUserStatusService,
} from "../services/user.service.js";

const getRequestContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("User not authenticated", 401);
  }

  const user = await getCurrentUserService(req.user.id);

  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: user,
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const roleValue = req.query.role
    ? String(req.query.role).toUpperCase()
    : undefined;

  const statusValue = req.query.status
    ? String(req.query.status).toUpperCase()
    : undefined;

  if (roleValue && !Object.values(Role).includes(roleValue as Role)) {
    throw new APIError("Invalid role value", 400);
  }

  if (
    statusValue &&
    !Object.values(UserStatus).includes(statusValue as UserStatus)
  ) {
    throw new APIError("Invalid status value", 400);
  }

  const search = req.query.search ? String(req.query.search).trim() : undefined;

  const district = req.query.district
    ? String(req.query.district).trim()
    : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleValue && {
      role: roleValue as Role,
    }),

    ...(statusValue && {
      status: statusValue as UserStatus,
    }),

    ...(district && {
      district: {
        equals: district,
        mode: "insensitive",
      },
    }),

    ...(search && {
      OR: [
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const result = await getAllUsersService({
    skip,
    limit,
    where,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: result.users,
    pagination: {
      page,
      ...result.pagination,
    },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);

  const user = await getUserByIdService(userId);

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new APIError("User not authenticated", 401);
    }

    const user = await updateUserProfileService(
      req.user.id,
      req.body,
      getRequestContext(req)
    );

    logger.info("User profile updated", {
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  }
);

export const updateUserAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new APIError("User not authenticated", 401);
    }

    if (!req.file) {
      throw new APIError("Avatar image is required", 400);
    }

    const user = await updateUserAvatarService(
      req.user.id,
      req.file.buffer,
      getRequestContext(req)
    );

    logger.info("User avatar updated", {
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: user,
    });
  }
);

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);

    const user = await updateUserStatusService(
      userId,
      req.body,
      getRequestContext(req)
    );

    logger.info("User status updated", {
      userId,
      status: req.body.status,
      updatedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  }
);

export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);

    const user = await updateUserRoleService(
      userId,
      req.body,
      getRequestContext(req)
    );

    logger.info("User role updated", {
      userId,
      role: req.body.role,
      updatedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  }
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);

  const result = await deleteUserService(userId, getRequestContext(req));

  logger.warn("User deleted", {
    userId,
    deletedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getUserStatsService();

  res.status(200).json({
    success: true,
    message: "User statistics fetched successfully",
    data: stats,
  });
});

/* ─────────────────────────────────────────
   PROVISION ACCOUNT (Admin creates INSTITUTION or GOVERNMENT_PARTNER)
   POST /api/v1/users/provision
───────────────────────────────────────── */
export const provisionAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Not authenticated", 401);

  const { fullName, email, password, phone, role } = req.body as {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: "INSTITUTION" | "GOVERNMENT_PARTNER";
  };

  if (!fullName || !email || !password || !role) {
    throw new APIError("fullName, email, password, and role are required", 400);
  }

  if (!["INSTITUTION", "GOVERNMENT_PARTNER"].includes(role)) {
    throw new APIError("Role must be INSTITUTION or GOVERNMENT_PARTNER", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new APIError("An account with this email already exists", 409);

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      ...(phone ? { phone } : {}),
      password: hashedPassword,
      role,
      status: "ACTIVE",
      isEmailVerified: true,
      isPhoneVerified: false,
    },
    select: safeUserSelect,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const loginUrl = role === "INSTITUTION"
    ? `${frontendUrl}/login`
    : `${frontendUrl}/login`;

  await sendEmail({
    to: email,
    subject: `Your Umuhinzi Credit ${role === "INSTITUTION" ? "Institution" : "Government"} Account`,
    html: provisionedAccountTemplate({ fullName, email, temporaryPassword: password, role, loginUrl }),
  });

  await writeAuditLog({
    actorId: req.user.id,
    action: "CREATE",
    resource: "USER",
    resourceId: user.id,
    description: `Admin provisioned ${role} account for ${email}`,
    metadata: { role, email },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  logger.info("Account provisioned", { provisionedBy: req.user.id, email, role });

  res.status(201).json({
    success: true,
    message: `Account created and credentials sent to ${email}`,
    data: user,
  });
});