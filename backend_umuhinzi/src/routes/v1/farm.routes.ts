import { Router } from "express";

import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  updateFarmStatus,
  deleteFarm,
} from "../../controllers/farm.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createFarmSchema,
  updateFarmSchema,
  updateFarmStatusSchema,
  farmIdParamSchema,
} from "../../validators/farm.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/farms:
 *   post:
 *     summary: Create a farm
 *     description: Creates a new farm linked to the authenticated farmer's profile.
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, landSize, district]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bugesera Farm"
 *               landSize:
 *                 type: number
 *                 example: 2.5
 *               landUnit:
 *                 type: string
 *                 enum: [HECTARE, ACRE, SQUARE_METER]
 *               ownershipType:
 *                 type: string
 *                 enum: [OWNED, RENTED, FAMILY_LAND, COOPERATIVE_LAND, GOVERNMENT_ALLOCATED, OTHER]
 *               soilType:
 *                 type: string
 *                 enum: [CLAY, SANDY, SILT, LOAM, PEAT, CHALKY, UNKNOWN]
 *               district:
 *                 type: string
 *                 example: "Bugesera"
 *     responses:
 *       201:
 *         description: Farm created successfully
 *       404:
 *         description: Farmer profile not found
 */
router.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createFarmSchema),
  createFarm
);

/**
 * @swagger
 * /api/v1/farms:
 *   get:
 *     summary: Get farms
 *     description: Farmers get their own farms; admins get all farms with optional filters.
 *     tags: [Farms]
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
 *         name: district
 *         schema:
 *           type: string
 *         description: Admin only — filter by district
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, UNDER_REVIEW]
 *         description: Admin only — filter by status
 *     responses:
 *       200:
 *         description: Farms fetched successfully
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getFarms
);

/**
 * @swagger
 * /api/v1/farms/{id}:
 *   get:
 *     summary: Get farm by ID
 *     description: Farmers can only access their own farms; admins can access any farm.
 *     tags: [Farms]
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
 *         description: Farm fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Farm not found
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(farmIdParamSchema),
  getFarmById
);

/**
 * @swagger
 * /api/v1/farms/{id}:
 *   patch:
 *     summary: Update farm
 *     description: Updates a farm. Only the owning farmer can update their farm.
 *     tags: [Farms]
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
 *         description: Farm updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Farm not found
 */
router.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateFarmSchema),
  updateFarm
);

/**
 * @swagger
 * /api/v1/farms/{id}/status:
 *   patch:
 *     summary: Update farm status
 *     description: Updates a farm's operational status. Admin only.
 *     tags: [Farms]
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
 *                 enum: [ACTIVE, INACTIVE, UNDER_REVIEW]
 *     responses:
 *       200:
 *         description: Farm status updated successfully
 */
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateFarmStatusSchema),
  updateFarmStatus
);

/**
 * @swagger
 * /api/v1/farms/{id}:
 *   delete:
 *     summary: Delete farm
 *     description: Deletes a farm. Farmers can delete their own; admins can delete any.
 *     tags: [Farms]
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
 *         description: Farm deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Farm not found
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(farmIdParamSchema),
  deleteFarm
);

export default router;
