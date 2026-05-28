import { Router } from "express";

import {
  getPlatformAnalytics,
  getFarmerAnalytics,
  getRegionalAnalytics,
  generateAnalyticsReport,
  getAnalyticsReports,
} from "../../controllers/analytics.controller.js";

import {
  authenticate,
  requireAdmin,
  requireAdminOrGovernmentPartner,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

export const analyticsRouter = Router();

/**
 * @swagger
 * /api/v1/analytics:
 *   get:
 *     summary: Platform-wide analytics
 *     description: Aggregate stats — farmers, loans, repayments, credit scores, institutions, cooperatives. ADMIN and GOVERNMENT_PARTNER only.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics fetched successfully
 */
analyticsRouter.get(
  "/",
  authenticate,
  requireAdminOrGovernmentPartner,
  getPlatformAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/regional:
 *   get:
 *     summary: Regional analytics breakdown
 *     description: Farmers, loans, and credit scores grouped by province and district.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Regional analytics fetched successfully
 */
analyticsRouter.get(
  "/regional",
  authenticate,
  requireAdminOrGovernmentPartner,
  getRegionalAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   post:
 *     summary: Generate and store an analytics report (ADMIN only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType, title]
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [FARMER_GROWTH, PRODUCTIVITY, LOAN_ANALYTICS, REGIONAL_PERFORMANCE, FINANCIAL_INCLUSION, REPAYMENT_PERFORMANCE, COOPERATIVE_PERFORMANCE]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [ADMIN_ONLY, INSTITUTION, COOPERATIVE, GOVERNMENT_PARTNER, PUBLIC_SUMMARY]
 *     responses:
 *       201:
 *         description: Report generated successfully
 */
analyticsRouter.post(
  "/reports",
  authenticate,
  requireAdmin,
  generateAnalyticsReport
);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   get:
 *     summary: List stored analytics reports
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
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
 *         description: Reports fetched successfully
 */
analyticsRouter.get(
  "/reports",
  authenticate,
  requireAdminOrGovernmentPartner,
  getAnalyticsReports
);

/**
 * @swagger
 * /api/v1/analytics/farmer/{id}:
 *   get:
 *     summary: Per-farmer analytics
 *     description: Loan, repayment, and credit score summary for a specific farmer. ADMIN sees any. FARMER sees own only.
 *     tags: [Analytics]
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
 *         description: Farmer analytics fetched successfully
 */
analyticsRouter.get(
  "/farmer/:id",
  authenticate,
  authorizeRoles("ADMIN", "FARMER", "GOVERNMENT_PARTNER"),
  getFarmerAnalytics
);
