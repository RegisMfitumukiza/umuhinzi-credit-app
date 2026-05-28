import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import {
  forgotPasswordService,
  getAuthUserService,
  loginUserService,
  logoutUserService,
  refreshTokenService,
  registerUserService,
  resendVerificationEmailService,
  resetPasswordService,
  verifyEmailService,
} from "../services/auth.service.js";

const getRequestContext = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUserService(req.body, getRequestContext(req));
  logger.info("User registered", {
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
  });
  if (result.user.role === "FARMER") {
    const { createFarmerProfileService } = await import("../services/farmer.service.js");
    await createFarmerProfileService(result.user.id, {}, getRequestContext(req));
  }
  res.status(201).json({
    success: true,
    message: "User registered successfully. Please check your email for verification.",
    data: result,
  });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUserService(req.body, getRequestContext(req));
  logger.info("User logged in", {
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
  });
  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshTokenService(req.body, getRequestContext(req));
  res.status(200).json({
    success: true,
    message: "Token refreshed successfully.",
    data: result,
  });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("User not authenticated", 401);
  }
  const result = await logoutUserService(req.user.id, getRequestContext(req));
  logger.info("User logged out", { userId: req.user.id });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await forgotPasswordService(req.body, getRequestContext(req));
  logger.info("Password reset requested", { email: req.body.email });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await resetPasswordService(req.body, getRequestContext(req));
  logger.info("Password reset completed");
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = await verifyEmailService(req.body, getRequestContext(req));
  logger.info("Email verified", { userId: user.id, email: user.email });
  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    data: user,
  });
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await resendVerificationEmailService(req.body, getRequestContext(req));
  logger.info("Verification email requested", { email: req.body.email });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const getAuthUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("User not authenticated", 401);
  }
  const user = await getAuthUserService(req.user.id);
  res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully.",
    data: user,
  });
});
