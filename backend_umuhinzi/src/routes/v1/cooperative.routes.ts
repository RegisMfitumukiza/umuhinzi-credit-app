import { Router } from "express";

import {
  createCooperative,
  getCooperatives,
  getCooperativeById,
  updateCooperative,
  deleteCooperative,
  updateCooperativeStatus,
  addCooperativeMember,
  getCooperativeMembers,
  removeCooperativeMember,
  updateCooperativeMember,
} from "../../controllers/cooperative.controller.js";

import {
  authenticate,
  requireAdmin,
  requireCooperativeManager,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createCooperativeSchema,
  updateCooperativeSchema,
  cooperativeIdParamSchema,
  addCooperativeMemberSchema,
  updateCooperativeMemberSchema,
  cooperativeMemberIdParamSchema,
} from "../../validators/cooperative.schema.js";

/* ─────────────────────────────────────────
   COOPERATIVES  /api/v1/cooperatives
───────────────────────────────────────── */

export const cooperativeRouter = Router();

/**
 * @swagger
 * /api/v1/cooperatives:
 *   post:
 *     summary: Create a cooperative
 *     description: COOPERATIVE_MANAGER creates a cooperative. A manager record is auto-created for the creator.
 *     tags: [Cooperatives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               province:
 *                 type: string
 *               district:
 *                 type: string
 *               sector:
 *                 type: string
 *               cell:
 *                 type: string
 *               village:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cooperative created successfully
 *       409:
 *         description: Registration number already in use
 */
cooperativeRouter.post(
  "/",
  authenticate,
  requireCooperativeManager,
  validate(createCooperativeSchema),
  createCooperative
);

/**
 * @swagger
 * /api/v1/cooperatives:
 *   get:
 *     summary: List cooperatives
 *     description: All authenticated users can list cooperatives.
 *     tags: [Cooperatives]
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
 *         description: Cooperatives fetched successfully
 */
cooperativeRouter.get("/", authenticate, getCooperatives);

/**
 * @swagger
 * /api/v1/cooperatives/{id}:
 *   get:
 *     summary: Get cooperative by ID
 *     tags: [Cooperatives]
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
 *         description: Cooperative fetched successfully
 *       404:
 *         description: Not found
 */
cooperativeRouter.get(
  "/:id",
  authenticate,
  validate(cooperativeIdParamSchema),
  getCooperativeById
);

/**
 * @swagger
 * /api/v1/cooperatives/{id}:
 *   patch:
 *     summary: Update cooperative
 *     description: COOPERATIVE_MANAGER can update their own cooperative. ADMIN can update any.
 *     tags: [Cooperatives]
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
 *         description: Cooperative updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
cooperativeRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "COOPERATIVE_MANAGER"),
  validate(updateCooperativeSchema),
  updateCooperative
);

/**
 * @swagger
 * /api/v1/cooperatives/{id}:
 *   delete:
 *     summary: Delete cooperative (ADMIN only)
 *     description: Soft-deletes by setting status to DEACTIVATED.
 *     tags: [Cooperatives]
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
 *         description: Cooperative deactivated successfully
 *       404:
 *         description: Not found
 */
cooperativeRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(cooperativeIdParamSchema),
  deleteCooperative
);

/**
 * @swagger
 * /api/v1/cooperatives/{id}/status:
 *   patch:
 *     summary: Update cooperative status (ADMIN only)
 *     description: ADMIN activates, suspends, or deactivates a cooperative. Cooperatives start as PENDING.
 *     tags: [Cooperatives]
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
 *                 enum: [PENDING, ACTIVE, SUSPENDED, DEACTIVATED]
 *     responses:
 *       200:
 *         description: Cooperative status updated successfully
 *       404:
 *         description: Not found
 */
cooperativeRouter.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(cooperativeIdParamSchema),
  updateCooperativeStatus
);

/* ─────────────────────────────────────────
   COOPERATIVE MEMBERS  /api/v1/cooperative-members
───────────────────────────────────────── */

export const cooperativeMemberRouter = Router();

/**
 * @swagger
 * /api/v1/cooperative-members:
 *   post:
 *     summary: Join a cooperative
 *     description: Farmer joins a cooperative. One active membership at a time.
 *     tags: [Cooperative Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cooperativeId]
 *             properties:
 *               cooperativeId:
 *                 type: string
 *                 format: uuid
 *               joinedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Joined cooperative successfully
 *       409:
 *         description: Already an active member
 */
cooperativeMemberRouter.post(
  "/",
  authenticate,
  authorizeRoles("FARMER"),
  validate(addCooperativeMemberSchema),
  addCooperativeMember
);

/**
 * @swagger
 * /api/v1/cooperative-members:
 *   get:
 *     summary: List cooperative members
 *     description: COOPERATIVE_MANAGER sees their own cooperative's members. ADMIN sees all (optionally filtered by cooperativeId).
 *     tags: [Cooperative Members]
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
 *         name: cooperativeId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Members fetched successfully
 */
cooperativeMemberRouter.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "COOPERATIVE_MANAGER"),
  getCooperativeMembers
);

cooperativeMemberRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "COOPERATIVE_MANAGER"),
  validate(updateCooperativeMemberSchema),
  updateCooperativeMember
);

/**
 * @swagger
 * /api/v1/cooperative-members/{id}:
 *   delete:
 *     summary: Remove a cooperative member
 *     description: COOPERATIVE_MANAGER removes from their cooperative. FARMER can remove themselves. ADMIN can remove any.
 *     tags: [Cooperative Members]
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
 *         description: Member removed successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
cooperativeMemberRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "COOPERATIVE_MANAGER", "FARMER"),
  validate(cooperativeMemberIdParamSchema),
  removeCooperativeMember
);
