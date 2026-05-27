import { Router } from "express";

import {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  markRecommendationRead,
} from "../../controllers/recommendation.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createRecommendationSchema,
  recommendationIdParamSchema,
} from "../../validators/recommendation.schema.js";

export const recommendationRouter = Router();

/**
 * @swagger
 * /api/v1/recommendations:
 *   post:
 *     summary: Create a recommendation for a farmer (ADMIN only)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmerId, type, title, message]
 *             properties:
 *               farmerId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [LOAN_AMOUNT, FINANCIAL_IMPROVEMENT, REPAYMENT_STRATEGY, PRODUCTIVITY, RISK_REDUCTION, DATA_COMPLETENESS, GENERAL_ADVISORY]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               actionLabel:
 *                 type: string
 *               actionUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recommendation created successfully
 *       404:
 *         description: Farmer not found
 */
recommendationRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createRecommendationSchema),
  createRecommendation
);

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     summary: Get recommendations
 *     description: Farmers see their own. ADMIN sees all.
 *     tags: [Recommendations]
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
 *         description: Recommendations fetched successfully
 */
recommendationRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getRecommendations
);

/**
 * @swagger
 * /api/v1/recommendations/{id}:
 *   get:
 *     summary: Get recommendation by ID
 *     description: Farmers can only access their own recommendations.
 *     tags: [Recommendations]
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
 *         description: Recommendation fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
recommendationRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(recommendationIdParamSchema),
  getRecommendationById
);

/**
 * @swagger
 * /api/v1/recommendations/{id}/read:
 *   patch:
 *     summary: Mark recommendation as read (FARMER only)
 *     tags: [Recommendations]
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
 *         description: Recommendation marked as read
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
recommendationRouter.patch(
  "/:id/read",
  authenticate,
  requireFarmer,
  validate(recommendationIdParamSchema),
  markRecommendationRead
);
