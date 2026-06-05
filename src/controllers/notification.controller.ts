import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { Role } from "../generated/prisma/client.js";

import {
  getMyNotificationsService,
  getUnreadCountService,
  markNotificationReadService,
  markAllNotificationsReadService,
  deleteNotificationService,
  deleteReadNotificationsService,
  sendNotificationService,
} from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const rawIsRead = req.query.isRead;
  const isRead =
    rawIsRead === "true" ? true : rawIsRead === "false" ? false : undefined;

  const rawType = req.query.type ? String(req.query.type) : undefined;
  const rawPriority = req.query.priority ? String(req.query.priority) : undefined;

  const VALID_TYPES = [
    "LOAN_APPROVAL",
    "REPAYMENT_REMINDER",
    "CREDIT_SCORE_UPDATE",
    "MISSING_DATA_ALERT",
    "COOPERATIVE_ANNOUNCEMENT",
    "SYSTEM",
    "GENERAL",
  ] as const;
  const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

  type NotifType = (typeof VALID_TYPES)[number];
  type NotifPriority = (typeof VALID_PRIORITIES)[number];

  const type = VALID_TYPES.includes(rawType as NotifType)
    ? (rawType as NotifType)
    : undefined;
  const priority = VALID_PRIORITIES.includes(rawPriority as NotifPriority)
    ? (rawPriority as NotifPriority)
    : undefined;

  const result = await getMyNotificationsService(req.user.id, {
    skip,
    limit,
    isRead,
    type,
    priority,
  });

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: result.notifications,
    pagination: { page, ...result.pagination },
  });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await getUnreadCountService(req.user.id);

  res.status(200).json({
    success: true,
    message: "Unread notification count fetched successfully",
    data: result,
  });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const notification = await markNotificationReadService(
    String(req.params.id),
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await markAllNotificationsReadService(req.user.id);

  res.status(200).json({ success: true, ...result });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const isAdmin = req.user.role === Role.ADMIN;
  const result = await deleteNotificationService(
    String(req.params.id),
    req.user.id,
    isAdmin
  );

  res.status(200).json({ success: true, ...result });
});

export const deleteReadNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await deleteReadNotificationsService(req.user.id);

  res.status(200).json({ success: true, ...result });
});

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const result = await sendNotificationService(req.body);

  res.status(201).json({ success: true, ...result });
});
