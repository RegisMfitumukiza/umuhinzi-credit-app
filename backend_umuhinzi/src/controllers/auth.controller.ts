import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

import {
  forgotPasswordService,
  getAuthUserService,
  loginUserService,
  registerUserService,
  resetPasswordService,
  verifyEmailService,
  refreshAccessTokenService,
  logoutService,
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

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please check your email for verification.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
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
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (!token) throw new APIError("Refresh token is required", 400);

  const result = await refreshAccessTokenService(token);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await logoutService(req.user.id, getRequestContext(req));

  res.status(200).json({ success: true, message: result.message });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await forgotPasswordService(req.body, getRequestContext(req));

  logger.info("Password reset requested", { email: req.body.email });

  res.status(200).json({ success: true, message: result.message });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await resetPasswordService(req.body, getRequestContext(req));

  logger.info("Password reset completed");

  res.status(200).json({ success: true, message: result.message });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = await verifyEmailService(req.body, getRequestContext(req));

  logger.info("Email verified", { userId: user.id, email: user.email });

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    data: user,
  });
});

export const getAuthUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const user = await getAuthUserService(req.user.id);

  res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully",
    data: user,
  });
});
