import { Router } from "express";
import { authenticate, requireAdmin, requireRole } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createFarmerSchema,
  updateFarmerSchema,
  farmerIdParamSchema,
  updateFarmerCredibilitySchema,
  assignFarmerToCooperativeSchema,
  removeFarmerFromCooperativeSchema,
} from "../../validators/farmer.schema.js";
import * as farmerController from "../../controllers/farmer.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Farmers
 *   description: Farmer profile management
 */

/**
 * @swagger
 * /farmers:
 *   post:
 *     summary: Create a farmer profile
 *     description: Creates a profile for the authenticated FARMER user. Each user can only have one farmer profile.
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFarmerInput'
 *     responses:
 *       201:
 *         description: Farmer profile created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: User does not have FARMER role
 *       409:
 *         description: Farmer profile already exists
 */
router.post(
  "/",
  authenticate,
  requireRole("FARMER"),
  validate(createFarmerSchema),
  farmerController.createFarmerProfile
);

/**
 * @swagger
 * /farmers/{id}:
 *   get:
 *     summary: Get a farmer profile by ID
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
 *         description: Farmer profile retrieved
 *       404:
 *         description: Farmer not found
 */
router.get(
  "/:id",
  authenticate,
  validate(farmerIdParamSchema),
  farmerController.getFarmerById
);

/**
 * @swagger
 * /farmers/{id}:
 *   patch:
 *     summary: Update a farmer profile
 *     description: A farmer can update their own profile. Admins can update any profile.
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
 *             $ref: '#/components/schemas/UpdateFarmerInput'
 *     responses:
 *       200:
 *         description: Farmer profile updated
 *       403:
 *         description: Not allowed to update this profile
 *       404:
 *         description: Farmer not found
 */
router.patch(
  "/:id",
  authenticate,
  validate(updateFarmerSchema),
  farmerController.updateFarmerProfile
);

/**
 * @swagger
 * /farmers/{id}/verify:
 *   patch:
 *     summary: Verify a farmer (Admin only)
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
 *         description: Farmer verified
 *       403:
 *         description: Admins only
 *       404:
 *         description: Farmer not found
 *       409:
 *         description: Farmer already verified
 */
router.patch(
  "/:id/verify",
  authenticate,
  requireAdmin,
  validate(farmerIdParamSchema),
  farmerController.verifyFarmer
);

/**
 * @swagger
 * /farmers/{id}/suspend:
 *   patch:
 *     summary: Suspend a farmer (Admin only)
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
 *         description: Farmer suspended
 *       403:
 *         description: Admins only
 *       404:
 *         description: Farmer not found
 *       409:
 *         description: Farmer already suspended
 */
router.patch(
  "/:id/suspend",
  authenticate,
  requireAdmin,
  validate(farmerIdParamSchema),
  farmerController.suspendFarmer
);

/**
 * @swagger
 * /farmers/{id}/credibility:
 *   patch:
 *     summary: Update farmer credibility status (Admin or Institution)
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
 *             $ref: '#/components/schemas/UpdateFarmerCredibilityInput'
 *     responses:
 *       200:
 *         description: Credibility updated
 *       403:
 *         description: Admins and institutions only
 *       404:
 *         description: Farmer not found
 */
router.patch(
  "/:id/credibility",
  authenticate,
  requireRole("ADMIN", "INSTITUTION"),
  validate(updateFarmerCredibilitySchema),
  farmerController.updateFarmerCredibility
);

/**
 * @swagger
 * /farmers/{id}/cooperative:
 *   patch:
 *     summary: Assign farmer to a cooperative (Admin or Cooperative Manager)
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
 *             $ref: '#/components/schemas/AssignFarmerToCooperativeInput'
 *     responses:
 *       200:
 *         description: Farmer assigned to cooperative
 *       403:
 *         description: Admins and cooperative managers only
 *       404:
 *         description: Farmer or cooperative not found
 */
router.patch(
  "/:id/cooperative",
  authenticate,
  requireRole("ADMIN", "COOPERATIVE_MANAGER"),
  validate(assignFarmerToCooperativeSchema),
  farmerController.assignFarmerToCooperative
);

/**
 * @swagger
 * /farmers/{id}/cooperative:
 *   delete:
 *     summary: Remove farmer from cooperative (Admin or Cooperative Manager)
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
 *         description: Farmer removed from cooperative
 *       403:
 *         description: Admins and cooperative managers only
 *       404:
 *         description: Farmer not found
 *       409:
 *         description: Farmer has no cooperative assigned
 */
router.delete(
  "/:id/cooperative",
  authenticate,
  requireRole("ADMIN", "COOPERATIVE_MANAGER"),
  validate(removeFarmerFromCooperativeSchema),
  farmerController.removeFarmerFromCooperative
);

export default router;
