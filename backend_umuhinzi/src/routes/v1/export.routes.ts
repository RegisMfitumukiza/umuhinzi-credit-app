import { Router } from "express";

import {
  exportLoans,
  exportRepayments,
  exportFarmers,
  exportRepaymentSchedules,
} from "../../controllers/export.controller.js";

import {
  authenticate,
  requireAdmin,
  requireAdminOrInstitution,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

export const exportRouter = Router();

/**
 * @swagger
 * /api/v1/exports/loans:
 *   get:
 *     summary: Export loans as CSV
 *     description: Downloads a CSV file of loans. ADMIN sees all; INSTITUTION sees their own.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [APPROVED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED, CANCELLED]
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
exportRouter.get(
  "/loans",
  authenticate,
  requireAdminOrInstitution,
  exportLoans
);

/**
 * @swagger
 * /api/v1/exports/repayments:
 *   get:
 *     summary: Export repayments as CSV
 *     description: Downloads a CSV file of repayment records.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: CSV file download
 */
exportRouter.get(
  "/repayments",
  authenticate,
  requireAdminOrInstitution,
  exportRepayments
);

/**
 * @swagger
 * /api/v1/exports/farmers:
 *   get:
 *     summary: Export farmers as CSV (ADMIN only)
 *     description: Downloads a CSV file of all farmer profiles with stats.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, SUSPENDED]
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 */
exportRouter.get(
  "/farmers",
  authenticate,
  authorizeRoles("ADMIN", "GOVERNMENT_PARTNER"),
  exportFarmers
);

/**
 * @swagger
 * /api/v1/exports/repayment-schedules:
 *   get:
 *     summary: Export repayment schedules as CSV
 *     description: Downloads a CSV of repayment schedules. Useful for overdue tracking.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPCOMING, DUE, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED]
 *     responses:
 *       200:
 *         description: CSV file download
 */
exportRouter.get(
  "/repayment-schedules",
  authenticate,
  requireAdminOrInstitution,
  exportRepaymentSchedules
);
