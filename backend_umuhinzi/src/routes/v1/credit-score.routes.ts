import { Router } from "express";

import {
  generateCreditScore,
  getCreditScores,
  getLatestCreditScore,
  getCreditScoreById,
  getCreditScoresByFarmerId,
} from "../../controllers/credit-score.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  generateCreditScoreSchema,
  creditScoreIdParamSchema,
  farmerIdParamSchema,
} from "../../validators/credit-score.schema.js";

export const creditScoreRouter = Router();

/**
 * @swagger
 * /api/v1/credit-scores/generate:
 *   post:
 *     summary: Generate credit score
 *     description: Calculates a new credit score using 9 weighted factors. Farmers generate their own score; admins can provide a `farmerId` to generate for any farmer.
 *     tags: [Credit Scores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               farmerId:
 *                 type: string
 *                 format: uuid
 *                 description: Admin only — target farmer ID
 *     responses:
 *       201:
 *         description: Credit score generated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Farmer profile not found
 */
creditScoreRouter.post(
  "/generate",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(generateCreditScoreSchema),
  generateCreditScore
);

/**
 * @swagger
 * /api/v1/credit-scores/latest:
 *   get:
 *     summary: Get latest credit score
 *     description: Returns the most recently generated credit score for the authenticated farmer.
 *     tags: [Credit Scores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest credit score fetched successfully
 *       404:
 *         description: No credit score found
 */
creditScoreRouter.get(
  "/latest",
  authenticate,
  requireFarmer,
  getLatestCreditScore
);

/**
 * @swagger
 * /api/v1/credit-scores:
 *   get:
 *     summary: Get credit scores
 *     description: Farmers get their own credit score history; admins get all.
 *     tags: [Credit Scores]
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
 *         description: Credit scores fetched successfully
 */
creditScoreRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getCreditScores
);

/**
 * @swagger
 * /api/v1/credit-scores/farmers/{farmerId}:
 *   get:
 *     summary: Get credit scores by farmer ID
 *     description: Admin only. Returns all credit scores for a specific farmer.
 *     tags: [Credit Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Credit scores fetched successfully
 *       404:
 *         description: Farmer not found
 */
creditScoreRouter.get(
  "/farmers/:farmerId",
  authenticate,
  requireAdmin,
  validate(farmerIdParamSchema),
  getCreditScoresByFarmerId
);

/**
 * @swagger
 * /api/v1/credit-scores/{id}:
 *   get:
 *     summary: Get credit score by ID
 *     description: Returns a full credit score with all factor breakdowns and risk assessment. Farmers can only access their own scores.
 *     tags: [Credit Scores]
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
 *         description: Credit score fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Credit score not found
 */
creditScoreRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(creditScoreIdParamSchema),
  getCreditScoreById
);
