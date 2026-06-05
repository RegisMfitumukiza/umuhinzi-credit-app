import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications,
  sendNotification,
} from "../../controllers/notification.controller.js";

import {
  authenticate,
  requireAdmin,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  notificationIdParamSchema,
  sendNotificationSchema,
} from "../../validators/notification.schema.js";

export const notificationRouter = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Send a notification to a user (Admin)
 *     description: Admin creates and sends a targeted notification to any user by userId.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, title, message]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [LOAN_APPROVAL, REPAYMENT_REMINDER, CREDIT_SCORE_UPDATE, MISSING_DATA_ALERT, COOPERATIVE_ANNOUNCEMENT, SYSTEM, GENERAL]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               actionUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *       404:
 *         description: Target user not found
 */
notificationRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(sendNotificationSchema),
  sendNotification
);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Returns the authenticated user's notifications, newest first. Supports filtering by isRead, type, and priority.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true = read only, false = unread only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [LOAN_APPROVAL, REPAYMENT_REMINDER, CREDIT_SCORE_UPDATE, MISSING_DATA_ALERT, COOPERATIVE_ANNOUNCEMENT, SYSTEM, GENERAL]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 */
notificationRouter.get("/", authenticate, getNotifications);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: Returns the count of unread notifications for the authenticated user. Use this for badge indicators.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
 */
notificationRouter.get("/unread-count", authenticate, getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationRouter.patch("/read-all", authenticate, markAllNotificationsRead);

/**
 * @swagger
 * /api/v1/notifications/read:
 *   delete:
 *     summary: Delete all read notifications
 *     description: Removes all notifications that have already been read by the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications deleted
 */
notificationRouter.delete("/read", authenticate, deleteReadNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
notificationRouter.patch(
  "/:id/read",
  authenticate,
  validate(notificationIdParamSchema),
  markNotificationRead
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Users delete their own notifications. Admins can delete any notification.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
notificationRouter.delete(
  "/:id",
  authenticate,
  validate(notificationIdParamSchema),
  deleteNotification
);
