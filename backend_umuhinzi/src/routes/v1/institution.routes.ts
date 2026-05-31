import { Router } from "express";

import {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  updateInstitutionStatus,
  deleteInstitution,
  addInstitutionStaff,
  getInstitutionStaff,
  removeInstitutionStaff,
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
  addInstitutionStaffSchema,
  institutionStaffIdParamSchema,
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
  requireAdminOrInstitution,
  getInstitutions
);

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

/* ─────────────────────────────────────────
   INSTITUTION STAFF  /api/v1/institutions/:id/staff
───────────────────────────────────────── */

/**
 * @swagger
 * /api/v1/institutions/{id}/staff:
 *   post:
 *     summary: Add a staff member to an institution
 *     description: ADMIN or the institution owner can add staff. Accepts any registered user by userId and assigns a role (ADMIN, LOAN_OFFICER, VIEWER).
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
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [ADMIN, LOAN_OFFICER, VIEWER]
 *     responses:
 *       201:
 *         description: Staff member added successfully
 *       409:
 *         description: User is already an active staff member
 *       404:
 *         description: Institution or user not found
 */
institutionRouter.post(
  "/:id/staff",
  authenticate,
  requireAdminOrInstitution,
  validate(addInstitutionStaffSchema),
  addInstitutionStaff
);

/**
 * @swagger
 * /api/v1/institutions/{id}/staff:
 *   get:
 *     summary: List active staff members of an institution
 *     description: ADMIN or the institution owner can list staff.
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
 *         description: Institution staff fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Institution not found
 */
institutionRouter.get(
  "/:id/staff",
  authenticate,
  requireAdminOrInstitution,
  validate(institutionIdParamSchema),
  getInstitutionStaff
);

/**
 * @swagger
 * /api/v1/institutions/{id}/staff/{staffId}:
 *   delete:
 *     summary: Remove a staff member from an institution
 *     description: ADMIN or the institution owner can remove staff. Sets status to REMOVED (soft delete).
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
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff member removed successfully
 *       400:
 *         description: Staff member already removed or belongs to different institution
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
institutionRouter.delete(
  "/:id/staff/:staffId",
  authenticate,
  requireAdminOrInstitution,
  validate(institutionStaffIdParamSchema),
  removeInstitutionStaff
);
