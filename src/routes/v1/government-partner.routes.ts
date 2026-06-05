import { Router } from "express";

import {
  createGovernmentPartner,
  getMyGovernmentPartnerProfile,
  getGovernmentPartners,
  getGovernmentPartnerById,
  updateGovernmentPartnerStatus,
} from "../../controllers/government-partner.controller.js";

import {
  authenticate,
  requireAdmin,
  requireGovernmentPartner,
  requireAdminOrGovernmentPartner,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createGovernmentPartnerSchema,
  updateGovernmentPartnerStatusSchema,
  governmentPartnerIdParamSchema,
} from "../../validators/government-partner.schema.js";

export const governmentPartnerRouter = Router();

/**
 * @swagger
 * /api/v1/government-partners:
 *   post:
 *     summary: Create government partner profile
 *     description: GOVERNMENT_PARTNER user creates their profile (one per account). Profile starts PENDING until admin approval.
 *     tags: [GovernmentPartners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationName, department, officialEmail, accessPurpose]
 *             properties:
 *               organizationName:
 *                 type: string
 *               department:
 *                 type: string
 *               officialEmail:
 *                 type: string
 *                 description: Must be an official .gov.rw email address
 *               mouReference:
 *                 type: string
 *                 description: MOU or data-sharing agreement reference number
 *               accessPurpose:
 *                 type: string
 *                 description: Why this government body needs access to platform data
 *     responses:
 *       201:
 *         description: Profile created, pending admin approval
 *       409:
 *         description: Profile already exists for this user
 */
governmentPartnerRouter.post(
  "/",
  authenticate,
  requireGovernmentPartner,
  validate(createGovernmentPartnerSchema),
  createGovernmentPartner
);

/**
 * @swagger
 * /api/v1/government-partners/me:
 *   get:
 *     summary: Get own government partner profile
 *     tags: [GovernmentPartners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       404:
 *         description: Profile not found
 */
governmentPartnerRouter.get(
  "/me",
  authenticate,
  requireGovernmentPartner,
  getMyGovernmentPartnerProfile
);

/**
 * @swagger
 * /api/v1/government-partners:
 *   get:
 *     summary: List all government partner profiles (ADMIN only)
 *     tags: [GovernmentPartners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, REJECTED, REVOKED]
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
 *         description: Government partners fetched successfully
 */
governmentPartnerRouter.get(
  "/",
  authenticate,
  requireAdmin,
  getGovernmentPartners
);

/**
 * @swagger
 * /api/v1/government-partners/{id}:
 *   get:
 *     summary: Get government partner profile by ID
 *     description: ADMIN sees any. GOVERNMENT_PARTNER sees own only.
 *     tags: [GovernmentPartners]
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
 *         description: Profile fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
governmentPartnerRouter.get(
  "/:id",
  authenticate,
  requireAdminOrGovernmentPartner,
  validate(governmentPartnerIdParamSchema),
  getGovernmentPartnerById
);

/**
 * @swagger
 * /api/v1/government-partners/{id}/status:
 *   patch:
 *     summary: Approve, reject, or revoke a government partner (ADMIN only)
 *     tags: [GovernmentPartners]
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
 *                 enum: [ACTIVE, REJECTED, REVOKED]
 *               adminNote:
 *                 type: string
 *                 description: Optional reason or note for the status decision
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Not found
 */
governmentPartnerRouter.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateGovernmentPartnerStatusSchema),
  updateGovernmentPartnerStatus
);
