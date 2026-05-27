import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { safeUserSelect } from "../utils/selects/user.select.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import { sendEmail } from "./email.service.js";
import {
  emailVerificationTemplate,
  passwordResetTemplate,
} from "../templates/auth-email.template.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  ForgotPasswordInput,
  LoginUserInput,
  RegisterUserInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "../validators/user.schema.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

const signAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new APIError("JWT_SECRET is missing", 500);
  const expiresIn = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

const generateRefreshToken = (): string => crypto.randomBytes(64).toString("hex");

const REFRESH_TOKEN_TTL_DAYS = 30;

const saveRefreshToken = async (userId: string): Promise<string> => {
  const token = generateRefreshToken();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_TTL_DAYS);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token, refreshTokenExpiry: expiry },
  });

  return token;
};

export const registerUserService = async (
  input: RegisterUserInput,
  context: RequestContext = {}
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new APIError("Email or phone number already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const createUserData = {
    fullName: input.fullName,
    email: input.email,
    ...(input.phone && {
      phone: input.phone,
    }),
    password: hashedPassword,
    role: input.role ?? "FARMER",
    status: "ACTIVE",
    isEmailVerified: process.env.SKIP_EMAIL_VERIFICATION === "true",
    isPhoneVerified: false,
    emailVerificationToken: process.env.SKIP_EMAIL_VERIFICATION === "true" ? undefined : emailVerificationToken,
    emailVerificationTokenExpiry: process.env.SKIP_EMAIL_VERIFICATION === "true" ? undefined : emailVerificationTokenExpiry,
  } satisfies Prisma.UserCreateInput;

  const user = await prisma.user.create({
    data: createUserData,
    select: safeUserSelect,
  });

  // Only send verification email if not skipping
  if (process.env.SKIP_EMAIL_VERIFICATION !== "true") {
    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your Umuhinzi Credit email",
      html: emailVerificationTemplate(verifyUrl),
    });
  }

  await writeAuditLog({
    actorId: user.id,
    action: "CREATE",
    resource: "USER",
    resourceId: user.id,
    description: "User account registered",
    metadata: {
      email: user.email,
      role: user.role,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await saveRefreshToken(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUserService = async (
  input: LoginUserInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new APIError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new APIError("Invalid email or password", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new APIError("Account is not active", 403);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
    select: safeUserSelect,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "LOGIN",
    resource: "AUTH",
    resourceId: user.id,
    description: "User logged in",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await saveRefreshToken(user.id);

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
};

export const forgotPasswordService = async (
  input: ForgotPasswordInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return {
      message:
        "If the email exists, password reset instructions have been sent.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Umuhinzi Credit password",
    html: passwordResetTemplate(resetUrl),
  });

  await writeAuditLog({
    actorId: user.id,
    action: "PASSWORD_RESET",
    resource: "AUTH",
    resourceId: user.id,
    description: "Password reset requested",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    message:
      "If the email exists, password reset instructions have been sent.",
  };
};

export const resetPasswordService = async (
  input: ResetPasswordInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: input.token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new APIError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      passwordChangedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "PASSWORD_RESET",
    resource: "AUTH",
    resourceId: user.id,
    description: "Password reset completed",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    message: "Password reset successfully.",
  };
};

export const verifyEmailService = async (
  input: VerifyEmailInput,
  context: RequestContext = {}
) => {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: input.token,
      emailVerificationTokenExpiry: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    throw new APIError("Invalid or expired verification token", 400);
  }

  if (user.isEmailVerified) {
    throw new APIError("Email is already verified", 400);
  }

  const verifiedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    },
    select: safeUserSelect,
  });

  await writeAuditLog({
    actorId: verifiedUser.id,
    action: "UPDATE",
    resource: "AUTH",
    resourceId: verifiedUser.id,
    description: "Email verified",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return verifiedUser;
};

export const getAuthUserService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: safeUserSelect,
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  return user;
};

/* ─────────────────────────────────────────
   REFRESH TOKEN
───────────────────────────────────────── */

export const refreshAccessTokenService = async (token: string) => {
  const user = await prisma.user.findUnique({
    where: { refreshToken: token },
    select: {
      id: true,
      status: true,
      refreshToken: true,
      refreshTokenExpiry: true,
    },
  });

  if (!user || !user.refreshToken || !user.refreshTokenExpiry) {
    throw new APIError("Invalid refresh token", 401);
  }

  if (user.refreshTokenExpiry < new Date()) {
    throw new APIError("Refresh token has expired. Please log in again.", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new APIError("Account is not active", 403);
  }

  const accessToken = signAccessToken(user.id);
  // Rotate refresh token on each use
  const newRefreshToken = await saveRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
};

/* ─────────────────────────────────────────
   LOGOUT
───────────────────────────────────────── */

export const logoutService = async (
  userId: string,
  context: RequestContext = {}
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null, refreshTokenExpiry: null },
  });

  await writeAuditLog({
    actorId: userId,
    action: "LOGOUT",
    resource: "AUTH",
    resourceId: userId,
    description: "User logged out",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Logged out successfully." };
};
