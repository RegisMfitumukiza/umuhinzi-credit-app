import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createFarmController,
  deleteFarmController,
  getAllFarmsController,
  getFarmByIdController,
  getMyFarmsController,
  updateFarmController,
} from "./farm.controller.js";
import { createFarmSchema, farmIdParamSchema, farmListQuerySchema, updateFarmSchema } from "./farm.validation.js";
import { farmSwaggerExamples } from "./farm.swagger.js";

const router = Router();

/**
 * @openapi
 * /api/farms:
 *   post:
 *     tags:
 *       - Farms
 *     summary: Create a farm
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Kigaliy Green Farm
 *             landSize: 2.5
 *             landUnit: HECTARE
 *             ownershipType: OWNED
 *             soilType: LOAM
 *             province: Kigali
 *             district: Gasabo
 *             sector: Kacyiru
 *             cell: Kamatamu
 *             village: Muganza
 *             latitude: -1.9441
 *             longitude: 30.0619
 *     responses:
 *       201:
 *         description: Farm created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/farms",
  authenticate,
  authorizeRoles(Role.FARMER),
  validate(createFarmSchema),
  createFarmController
);

/**
 * @openapi
 * /api/farms/me:
 *   get:
 *     tags:
 *       - Farms
 *     summary: Get the authenticated farmer's farms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farm list
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/farms/me",
  authenticate,
  authorizeRoles(Role.FARMER),
  validate(farmListQuerySchema),
  getMyFarmsController
);

/**
 * @openapi
 * /api/farms/{id}:
 *   get:
 *     tags:
 *       - Farms
 *     summary: Get a farm by ID
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
 *         description: Farm retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get(
  "/farms/:id",
  authenticate,
  authorizeRoles([Role.FARMER, Role.ADMIN]),
  validate(farmIdParamSchema),
  getFarmByIdController
);

/**
 * @openapi
 * /api/farms/{id}:
 *   patch:
 *     tags:
 *       - Farms
 *     summary: Update a farm
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
 *           example:
 *             name: Updated Farm Name
 *             landSize: 3
 *     responses:
 *       200:
 *         description: Farm updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch(
  "/farms/:id",
  authenticate,
  authorizeRoles([Role.FARMER, Role.ADMIN]),
  validate(updateFarmSchema),
  updateFarmController
);

/**
 * @openapi
 * /api/farms/{id}:
 *   delete:
 *     tags:
 *       - Farms
 *     summary: Delete a farm
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete(
  "/farms/:id",
  authenticate,
  authorizeRoles([Role.FARMER, Role.ADMIN]),
  validate(farmIdParamSchema),
  deleteFarmController
);

/**
 * @openapi
 * /api/admin/farms:
 *   get:
 *     tags:
 *       - Admin
 *       - Farms
 *     summary: Admin farm listing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farm list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/admin/farms",
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(farmListQuerySchema),
  getAllFarmsController
);

export default router;
