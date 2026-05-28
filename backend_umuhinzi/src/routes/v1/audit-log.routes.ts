import { Router } from "express";

import { getAuditLogs } from "../../controllers/audit-log.controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";

export const auditLogRouter = Router();

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Query audit logs (ADMIN only)
 *     description: Returns paginated audit logs with optional filters by actor, action, resource, resourceId, and date range.
 *     tags: [Audit Logs]
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
 *         name: actorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by the user who performed the action
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PASSWORD_RESET, STATUS_CHANGE, ROLE_CHANGE, FILE_UPLOAD, FILE_DELETE, SYSTEM]
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *           enum: [USER, FARMER, INSTITUTION, COOPERATIVE, FARM, CROP, LOAN, REPAYMENT, CREDIT_SCORE, NOTIFICATION, AUTH, SYSTEM]
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by the specific resource ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO 8601)
 *     responses:
 *       200:
 *         description: Audit logs fetched successfully
 *       403:
 *         description: Admin access required
 */
auditLogRouter.get("/", authenticate, requireAdmin, getAuditLogs);
