import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";

import {
  getMyNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  const result = await getMyNotificationsService(req.user.id, { skip, limit });

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: result.notifications,
    pagination: { page, ...result.pagination },
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
