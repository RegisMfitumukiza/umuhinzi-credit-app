import { Router } from "express";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../controllers/notification.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { notificationIdParamSchema } from "../../validators/notification.schema.js";

export const notificationRouter = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Returns the authenticated user's notifications, newest first.
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
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 */
notificationRouter.get("/", authenticate, getNotifications);

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
