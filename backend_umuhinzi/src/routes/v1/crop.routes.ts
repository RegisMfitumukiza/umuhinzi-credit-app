import { Router } from "express";

import {
  createSeason,
  getAllSeasons,
  getSeasonById,
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
} from "../../controllers/crop.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createCropSchema,
  updateCropSchema,
  cropIdParamSchema,
  createSeasonSchema,
  seasonIdParamSchema,
} from "../../validators/crop.schema.js";

/* ─────────────────────────────────────────
   FARMING SEASON ROUTES  /api/v1/seasons
───────────────────────────────────────── */

export const seasonRouter = Router();

/**
 * @swagger
 * /api/v1/seasons:
 *   post:
 *     summary: Create farming season
 *     description: Creates a new farming season. Admin only.
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, year, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Season A"
 *               year:
 *                 type: integer
 *                 example: 2025
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-31"
 *     responses:
 *       201:
 *         description: Farming season created successfully
 *       409:
 *         description: Season already exists
 */
seasonRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createSeasonSchema),
  createSeason
);

/**
 * @swagger
 * /api/v1/seasons:
 *   get:
 *     summary: Get all farming seasons
 *     description: Returns all available farming seasons ordered by year.
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farming seasons fetched successfully
 */
seasonRouter.get("/", authenticate, getAllSeasons);

/**
 * @swagger
 * /api/v1/seasons/{id}:
 *   get:
 *     summary: Get farming season by ID
 *     description: Returns a single farming season by ID.
 *     tags: [Seasons]
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
 *         description: Farming season fetched successfully
 *       404:
 *         description: Season not found
 */
seasonRouter.get(
  "/:id",
  authenticate,
  validate(seasonIdParamSchema),
  getSeasonById
);

/* ─────────────────────────────────────────
   CROP ROUTES  /api/v1/crops
───────────────────────────────────────── */

export const cropRouter = Router();

/**
 * @swagger
 * /api/v1/crops:
 *   post:
 *     summary: Create crop record
 *     description: Logs a new crop for the authenticated farmer's farm.
 *     tags: [Crops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmId, seasonId, cropName, cropType, plantingDate]
 *             properties:
 *               farmId:
 *                 type: string
 *                 format: uuid
 *               seasonId:
 *                 type: string
 *                 format: uuid
 *               cropName:
 *                 type: string
 *                 example: "Maize"
 *               cropType:
 *                 type: string
 *                 enum: [CEREAL, LEGUME, VEGETABLE, FRUIT, ROOT_TUBER, CASH_CROP, OTHER]
 *               plantingDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               expectedHarvestDate:
 *                 type: string
 *                 format: date
 *               estimatedArea:
 *                 type: number
 *                 example: 1.5
 *     responses:
 *       201:
 *         description: Crop created successfully
 *       403:
 *         description: Farm does not belong to farmer
 *       404:
 *         description: Farm or season not found
 */
cropRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createCropSchema),
  createCrop
);

/**
 * @swagger
 * /api/v1/crops:
 *   get:
 *     summary: Get crops
 *     description: Farmers get their own crops; admins get all crops.
 *     tags: [Crops]
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
 *         name: farmId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter crops by farm (farmer role only)
 *     responses:
 *       200:
 *         description: Crops fetched successfully
 */
cropRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getCrops
);

/**
 * @swagger
 * /api/v1/crops/{id}:
 *   get:
 *     summary: Get crop by ID
 *     description: Farmers can only access crops from their own farms; admins can access any.
 *     tags: [Crops]
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
 *         description: Crop fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Crop not found
 */
cropRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(cropIdParamSchema),
  getCropById
);

/**
 * @swagger
 * /api/v1/crops/{id}:
 *   patch:
 *     summary: Update crop
 *     description: Updates a crop record. Only the owning farmer can update their crop.
 *     tags: [Crops]
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
 *         description: Crop updated successfully
 */
cropRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateCropSchema),
  updateCrop
);

/**
 * @swagger
 * /api/v1/crops/{id}:
 *   delete:
 *     summary: Delete crop
 *     description: Deletes a crop record. Farmers can delete their own; admins can delete any.
 *     tags: [Crops]
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
 *         description: Crop deleted successfully
 */
cropRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(cropIdParamSchema),
  deleteCrop
);
