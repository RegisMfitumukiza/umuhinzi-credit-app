import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";

import type { Prisma } from "../generated/prisma/client.js";

/* ─── Selects ─── */

const safeNotificationSelect = {
  id: true,
  userId: true,
  type: true,
  priority: true,
  title: true,
  message: true,
  isRead: true,
  readAt: true,
  actionUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

/* ─────────────────────────────────────────
   GET MY NOTIFICATIONS
───────────────────────────────────────── */

export const getMyNotificationsService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const { skip = 0, limit = 10 } = options;
  const where: Prisma.NotificationWhereInput = { userId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeNotificationSelect,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
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
   MARK NOTIFICATION AS READ
───────────────────────────────────────── */

export const markNotificationReadService = async (
  notificationId: string,
  userId: string
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification) throw new APIError("Notification not found.", 404);
  if (notification.userId !== userId) {
    throw new APIError("Not authorized to update this notification.", 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
    select: safeNotificationSelect,
  });
};

/* ─────────────────────────────────────────
   MARK ALL NOTIFICATIONS AS READ
───────────────────────────────────────── */

export const markAllNotificationsReadService = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { message: `${result.count} notification(s) marked as read.` };
};
