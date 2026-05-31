import { Router } from "express";

import {
  createInstitution,
  getInstitutions,
  getAvailableInstitutions,
  getInstitutionById,
  updateInstitution,
  updateInstitutionStatus,
  deleteInstitution,
} from "../../controllers/institution.controller.js";

import {
  authenticate,
  requireAdmin,
  requireAdminOrInstitution,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createInstitutionSchema,
  updateInstitutionSchema,
  updateInstitutionStatusSchema,
  institutionIdParamSchema,
} from "../../validators/institution.schema.js";

export const institutionRouter = Router();

/**
 * @swagger
 * /api/v1/institutions:
 *   post:
 *     summary: Create institution profile
 *     description: ADMIN or INSTITUTION user creates their institution profile (1:1 with User).
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SACCO, MICROFINANCE, BANK, NGO, GOVERNMENT_PROGRAM, OTHER]
 *               registrationNumber:
 *                 type: string
 *               licenseNumber:
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
 *         description: Institution created successfully
 *       409:
 *         description: Institution already exists for this user
 */
institutionRouter.post(
  "/",
  authenticate,
  requireAdminOrInstitution,
  validate(createInstitutionSchema),
  createInstitution
);

/**
 * @swagger
 * /api/v1/institutions:
 *   get:
 *     summary: List institutions
 *     description: ADMIN sees all. INSTITUTION sees only their own.
 *     tags: [Institutions]
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
 *         description: Institutions fetched successfully
 */
institutionRouter.get(
  "/",
  authenticate,
  getInstitutions
);

/**
 * @swagger
 * /api/v1/institutions/available:
 *   get:
 *     summary: List active institutions for farmers
 *     description: Returns active institutions that farmers can choose when applying for loans.
 *     tags: [Institutions]
 *     responses:
 *       200:
 *         description: Active institutions fetched successfully
 */
institutionRouter.get("/available", getAvailableInstitutions);

/**
 * @swagger
 * /api/v1/institutions/{id}:
 *   get:
 *     summary: Get institution by ID
 *     description: INSTITUTION users can only access their own institution.
 *     tags: [Institutions]
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
 *         description: Institution fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
institutionRouter.get(
  "/:id",
  authenticate,
  requireAdminOrInstitution,
  validate(institutionIdParamSchema),
  getInstitutionById
);

/**
 * @swagger
 * /api/v1/institutions/{id}:
 *   patch:
 *     summary: Update institution profile
 *     description: ADMIN can update any. INSTITUTION can only update their own.
 *     tags: [Institutions]
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
 *         description: Institution updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
institutionRouter.patch(
  "/:id",
  authenticate,
  requireAdminOrInstitution,
  validate(updateInstitutionSchema),
  updateInstitution
);

/**
 * @swagger
 * /api/v1/institutions/{id}/status:
 *   patch:
 *     summary: Update institution status (ADMIN only)
 *     description: ADMIN transitions institution status — PENDING → ACTIVE → SUSPENDED/DEACTIVATED.
 *     tags: [Institutions]
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
 *         description: Status updated successfully
 *       404:
 *         description: Not found
 */
institutionRouter.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateInstitutionStatusSchema),
  updateInstitutionStatus
);

/**
 * @swagger
 * /api/v1/institutions/{id}:
 *   delete:
 *     summary: Soft-delete institution (ADMIN only)
 *     description: Sets institution status to DEACTIVATED.
 *     tags: [Institutions]
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
 *         description: Institution deactivated successfully
 *       404:
 *         description: Not found
 */
institutionRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(institutionIdParamSchema),
  deleteInstitution
);
