import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { createNotification } from "../utils/notification.helper.js";

import type { Prisma, NotificationType, NotificationPriority } from "../generated/prisma/client.js";
import type { SendNotificationInput } from "../validators/notification.schema.js";

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
  options: {
    skip?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  } = {}
) => {
  const { skip = 0, limit = 10, isRead, type, priority } = options;

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(isRead !== undefined && { isRead }),
    ...(type && { type }),
    ...(priority && { priority }),
  };

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
   GET UNREAD COUNT
───────────────────────────────────────── */

export const getUnreadCountService = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount: count };
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

/* ─────────────────────────────────────────
   DELETE NOTIFICATION
───────────────────────────────────────── */

export const deleteNotificationService = async (
  notificationId: string,
  userId: string,
  isAdmin: boolean
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification) throw new APIError("Notification not found.", 404);

  if (!isAdmin && notification.userId !== userId) {
    throw new APIError("Not authorized to delete this notification.", 403);
  }

  await prisma.notification.delete({ where: { id: notificationId } });

  return { message: "Notification deleted successfully." };
};

/* ─────────────────────────────────────────
   DELETE READ NOTIFICATIONS (BULK)
───────────────────────────────────────── */

export const deleteReadNotificationsService = async (userId: string) => {
  const result = await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });

  return { message: `${result.count} read notification(s) deleted.` };
};

/* ─────────────────────────────────────────
   SEND NOTIFICATION (ADMIN)
───────────────────────────────────────── */

export const sendNotificationService = async (input: SendNotificationInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, status: true },
  });

  if (!user) throw new APIError("Target user not found.", 404);
  if (user.status !== "ACTIVE") {
    throw new APIError("Cannot send notification to an inactive user.", 400);
  }

  await createNotification({
    userId: input.userId,
    type: input.type,
    priority: input.priority,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
  });

  return { message: "Notification sent successfully." };
};
