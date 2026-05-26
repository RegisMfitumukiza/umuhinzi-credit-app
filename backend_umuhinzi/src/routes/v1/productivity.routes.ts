import { Router } from "express";

import {
  createYieldRecord,
  getYieldRecords,
  getYieldRecordById,
  updateYieldRecord,
  deleteYieldRecord,
  createInputCost,
  getInputCosts,
  getInputCostById,
  updateInputCost,
  deleteInputCost,
  createProductivityRecord,
  getProductivityRecords,
  getProductivityRecordById,
  updateProductivityRecord,
  deleteProductivityRecord,
} from "../../controllers/productivity.controller.js";

import {
  authenticate,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createYieldRecordSchema,
  updateYieldRecordSchema,
  yieldRecordIdParamSchema,
  createInputCostSchema,
  updateInputCostSchema,
  inputCostIdParamSchema,
  createProductivityRecordSchema,
  updateProductivityRecordSchema,
  productivityRecordIdParamSchema,
} from "../../validators/productivity.schema.js";

/* ─────────────────────────────────────────
   YIELD RECORD ROUTES  /api/v1/yields
───────────────────────────────────────── */

export const yieldRouter = Router();

/**
 * @swagger
 * /api/v1/yields:
 *   post:
 *     summary: Create yield record
 *     description: Logs a harvest yield for a crop owned by the authenticated farmer.
 *     tags: [Yields]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cropId, actualYield, harvestDate]
 *             properties:
 *               cropId:
 *                 type: string
 *                 format: uuid
 *               expectedYield:
 *                 type: number
 *               actualYield:
 *                 type: number
 *               unit:
 *                 type: string
 *                 example: kg
 *               harvestDate:
 *                 type: string
 *                 format: date
 *               qualityGrade:
 *                 type: string
 *                 enum: [EXCELLENT, GOOD, AVERAGE, POOR, DAMAGED]
 *     responses:
 *       201:
 *         description: Yield record created successfully
 *       403:
 *         description: Crop does not belong to farmer
 *       404:
 *         description: Crop or farmer profile not found
 */
yieldRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createYieldRecordSchema),
  createYieldRecord
);

/**
 * @swagger
 * /api/v1/yields:
 *   get:
 *     summary: Get yield records
 *     description: Farmers get their own yield records; admins get all.
 *     tags: [Yields]
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
 *         name: cropId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Yield records fetched successfully
 */
yieldRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getYieldRecords
);

/**
 * @swagger
 * /api/v1/yields/{id}:
 *   get:
 *     summary: Get yield record by ID
 *     tags: [Yields]
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
 *         description: Yield record fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
yieldRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(yieldRecordIdParamSchema),
  getYieldRecordById
);

/**
 * @swagger
 * /api/v1/yields/{id}:
 *   patch:
 *     summary: Update yield record
 *     description: Only the owning farmer can update their yield record.
 *     tags: [Yields]
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
 *         description: Yield record updated successfully
 */
yieldRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateYieldRecordSchema),
  updateYieldRecord
);

/**
 * @swagger
 * /api/v1/yields/{id}:
 *   delete:
 *     summary: Delete yield record
 *     description: Farmers delete their own; admins delete any.
 *     tags: [Yields]
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
 *         description: Yield record deleted successfully
 */
yieldRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(yieldRecordIdParamSchema),
  deleteYieldRecord
);

/* ─────────────────────────────────────────
   INPUT COST ROUTES  /api/v1/input-costs
───────────────────────────────────────── */

export const inputCostRouter = Router();

/**
 * @swagger
 * /api/v1/input-costs:
 *   post:
 *     summary: Create input cost
 *     description: Logs a farming input cost (seeds, fertilizer, labor, etc.) for a crop.
 *     tags: [Input Costs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cropId, type, name, totalCost, dateUsed]
 *             properties:
 *               cropId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [SEED, FERTILIZER, PESTICIDE, HERBICIDE, LABOR, IRRIGATION, TRANSPORT, EQUIPMENT, STORAGE, OTHER]
 *               name:
 *                 type: string
 *               totalCost:
 *                 type: number
 *               dateUsed:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Input cost created successfully
 */
inputCostRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createInputCostSchema),
  createInputCost
);

/**
 * @swagger
 * /api/v1/input-costs:
 *   get:
 *     summary: Get input costs
 *     description: Farmers get their own input costs; admins get all.
 *     tags: [Input Costs]
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
 *         name: cropId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Input costs fetched successfully
 */
inputCostRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getInputCosts
);

/**
 * @swagger
 * /api/v1/input-costs/{id}:
 *   get:
 *     summary: Get input cost by ID
 *     tags: [Input Costs]
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
 *         description: Input cost fetched successfully
 */
inputCostRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(inputCostIdParamSchema),
  getInputCostById
);

/**
 * @swagger
 * /api/v1/input-costs/{id}:
 *   patch:
 *     summary: Update input cost
 *     tags: [Input Costs]
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
 *         description: Input cost updated successfully
 */
inputCostRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateInputCostSchema),
  updateInputCost
);

/**
 * @swagger
 * /api/v1/input-costs/{id}:
 *   delete:
 *     summary: Delete input cost
 *     tags: [Input Costs]
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
 *         description: Input cost deleted successfully
 */
inputCostRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(inputCostIdParamSchema),
  deleteInputCost
);

/* ─────────────────────────────────────────
   PRODUCTIVITY ROUTES  /api/v1/productivity
───────────────────────────────────────── */

export const productivityRouter = Router();

/**
 * @swagger
 * /api/v1/productivity:
 *   post:
 *     summary: Create productivity record
 *     description: Logs an overall seasonal productivity record for the authenticated farmer. One per season.
 *     tags: [Productivity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seasonId, totalActualYield, productivityRate]
 *             properties:
 *               seasonId:
 *                 type: string
 *                 format: uuid
 *               totalExpectedYield:
 *                 type: number
 *               totalActualYield:
 *                 type: number
 *               unit:
 *                 type: string
 *                 example: kg
 *               productivityRate:
 *                 type: number
 *                 example: 85.5
 *     responses:
 *       201:
 *         description: Productivity record created successfully
 *       409:
 *         description: Record for this season already exists
 */
productivityRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createProductivityRecordSchema),
  createProductivityRecord
);

/**
 * @swagger
 * /api/v1/productivity:
 *   get:
 *     summary: Get productivity records
 *     description: Farmers get their own; admins get all.
 *     tags: [Productivity]
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
 *         description: Productivity records fetched successfully
 */
productivityRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getProductivityRecords
);

/**
 * @swagger
 * /api/v1/productivity/{id}:
 *   get:
 *     summary: Get productivity record by ID
 *     tags: [Productivity]
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
 *         description: Productivity record fetched successfully
 */
productivityRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(productivityRecordIdParamSchema),
  getProductivityRecordById
);

/**
 * @swagger
 * /api/v1/productivity/{id}:
 *   patch:
 *     summary: Update productivity record
 *     tags: [Productivity]
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
 *         description: Productivity record updated successfully
 */
productivityRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateProductivityRecordSchema),
  updateProductivityRecord
);

/**
 * @swagger
 * /api/v1/productivity/{id}:
 *   delete:
 *     summary: Delete productivity record
 *     tags: [Productivity]
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
 *         description: Productivity record deleted successfully
 */
productivityRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(productivityRecordIdParamSchema),
  deleteProductivityRecord
);
