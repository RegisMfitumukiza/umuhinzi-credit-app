import { Router } from "express";

import {
  createFarmerProfile,
  getMyFarmerProfile,
  getAllFarmers,
  getFarmerById,
  updateMyFarmerProfile,
  updateFarmerStatus,
  updateFarmerCredibility,
  getFarmerStats,
} from "../../controllers/farmer.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createFarmerSchema,
  updateFarmerSchema,
  farmerIdParamSchema,
  updateFarmerStatusSchema,
  updateFarmerCredibilitySchema,
} from "../../validators/farmer.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/farmers:
 *   post:
 *     summary: Create farmer profile
 *     description: Creates a digital farmer profile for the authenticated user (FARMER role only). One profile per account.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nationalId]
 *             properties:
 *               nationalId:
 *                 type: string
 *                 example: "1199880012345678"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-20"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               farmingExperienceYears:
 *                 type: integer
 *                 example: 5
 *               primaryCrop:
 *                 type: string
 *                 example: "Maize"
 *     responses:
 *       201:
 *         description: Farmer profile created successfully
 *       409:
 *         description: Farmer profile already exists
 */
router.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createFarmerSchema),
  createFarmerProfile
);

/**
 * @swagger
 * /api/v1/farmers/stats:
 *   get:
 *     summary: Get farmer statistics
 *     description: Returns farmer counts by status and credibility. Admin only.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmer statistics fetched successfully
 */
router.get("/stats", authenticate, requireAdmin, getFarmerStats);

/**
 * @swagger
 * /api/v1/farmers/me:
 *   get:
 *     summary: Get my farmer profile
 *     description: Returns the farmer profile for the authenticated farmer.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmer profile fetched successfully
 *       404:
 *         description: Farmer profile not found
 */
router.get("/me", authenticate, requireFarmer, getMyFarmerProfile);

/**
 * @swagger
 * /api/v1/farmers/me:
 *   patch:
 *     summary: Update my farmer profile
 *     description: Updates the authenticated farmer's profile information.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmer profile updated successfully
 */
router.patch(
  "/me",
  authenticate,
  requireFarmer,
  validate(updateFarmerSchema),
  updateMyFarmerProfile
);

/**
 * @swagger
 * /api/v1/farmers:
 *   get:
 *     summary: Get all farmers
 *     description: Returns paginated list of all farmers. Admin only.
 *     tags: [Farmers]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, SUSPENDED]
 *       - in: query
 *         name: credibility
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, TRUSTED]
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Farmers fetched successfully
 */
router.get("/", authenticate, requireAdmin, getAllFarmers);

/**
 * @swagger
 * /api/v1/farmers/{id}:
 *   get:
 *     summary: Get farmer by ID
 *     description: Returns a single farmer by ID. Admin only.
 *     tags: [Farmers]
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
 *         description: Farmer fetched successfully
 *       404:
 *         description: Farmer not found
 */
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  validate(farmerIdParamSchema),
  getFarmerById
);

/**
 * @swagger
 * /api/v1/farmers/{id}/status:
 *   patch:
 *     summary: Update farmer status
 *     description: Updates a farmer's verification status. Admin only.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, VERIFIED, SUSPENDED]
 *     responses:
 *       200:
 *         description: Farmer status updated successfully
 */
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateFarmerStatusSchema),
  updateFarmerStatus
);

/**
 * @swagger
 * /api/v1/farmers/{id}/credibility:
 *   patch:
 *     summary: Update farmer credibility
 *     description: Updates a farmer's credibility status. Admin only.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credibilityStatus]
 *             properties:
 *               credibilityStatus:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, TRUSTED]
 *     responses:
 *       200:
 *         description: Farmer credibility updated successfully
 */
router.patch(
  "/:id/credibility",
  authenticate,
  requireAdmin,
  validate(updateFarmerCredibilitySchema),
  updateFarmerCredibility
);

export default router;
