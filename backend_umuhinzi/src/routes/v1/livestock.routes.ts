import { Router } from "express";

import {
  createLivestock,
  getLivestock,
  getLivestockById,
  updateLivestock,
  deleteLivestock,
} from "../../controllers/livestock.controller.js";

import {
  authenticate,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createLivestockSchema,
  updateLivestockSchema,
  livestockIdParamSchema,
} from "../../validators/livestock.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/livestock:
 *   post:
 *     summary: Create livestock record
 *     description: Logs a new livestock entry for the authenticated farmer.
 *     tags: [Livestock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CATTLE, GOAT, SHEEP, PIG, CHICKEN, DUCK, RABBIT, FISH, BEE, OTHER]
 *               purpose:
 *                 type: string
 *                 enum: [MILK, MEAT, EGGS, BREEDING, FARM_WORK, COMMERCIAL, OTHER]
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               estimatedValue:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       201:
 *         description: Livestock record created successfully
 *       404:
 *         description: Farmer profile not found
 */
router.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createLivestockSchema),
  createLivestock
);

/**
 * @swagger
 * /api/v1/livestock:
 *   get:
 *     summary: Get livestock
 *     description: Farmers get their own livestock records; admins get all.
 *     tags: [Livestock]
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
 *         description: Livestock fetched successfully
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getLivestock
);

/**
 * @swagger
 * /api/v1/livestock/{id}:
 *   get:
 *     summary: Get livestock record by ID
 *     description: Farmers can only access their own records; admins can access any.
 *     tags: [Livestock]
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
 *         description: Livestock record fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(livestockIdParamSchema),
  getLivestockById
);

/**
 * @swagger
 * /api/v1/livestock/{id}:
 *   patch:
 *     summary: Update livestock record
 *     description: Updates a livestock record. Only the owning farmer can update.
 *     tags: [Livestock]
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
 *         description: Livestock record updated successfully
 */
router.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateLivestockSchema),
  updateLivestock
);

/**
 * @swagger
 * /api/v1/livestock/{id}:
 *   delete:
 *     summary: Delete livestock record
 *     description: Deletes a livestock record. Farmers delete their own; admins delete any.
 *     tags: [Livestock]
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
 *         description: Livestock record deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(livestockIdParamSchema),
  deleteLivestock
);

export default router;
