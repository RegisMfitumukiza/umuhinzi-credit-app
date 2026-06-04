import { Router } from "express";

import {
  uploadFarmerDocument,
  uploadFarmImage,
  uploadInstitutionDocument,
  uploadCooperativeDocument,
  deleteUploadedFile,
} from "../../controllers/upload.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  requireAdminOrInstitution,
  requireCooperativeManager,
} from "../../middlewares/auth.middleware.js";

import {
  uploadSingleDocument,
  uploadSingleImage,
} from "../../middlewares/upload.middleware.js";

export const uploadRouter = Router();

/**
 * @swagger
 * /api/v1/uploads/farmer/documents:
 *   post:
 *     summary: Upload a farmer document (national ID, land certificate, etc.)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: File is required or invalid type
 */
uploadRouter.post(
  "/farmer/documents",
  authenticate,
  requireFarmer,
  uploadSingleDocument,
  uploadFarmerDocument
);

/**
 * @swagger
 * /api/v1/uploads/farms/{farmId}/images:
 *   post:
 *     summary: Upload a farm image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 */
uploadRouter.post(
  "/farms/:farmId/images",
  authenticate,
  requireFarmer,
  uploadSingleImage,
  uploadFarmImage
);

/**
 * @swagger
 * /api/v1/uploads/institution/documents:
 *   post:
 *     summary: Upload an institution document (license, registration, etc.)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
uploadRouter.post(
  "/institution/documents",
  authenticate,
  requireAdminOrInstitution,
  uploadSingleDocument,
  uploadInstitutionDocument
);

/**
 * @swagger
 * /api/v1/uploads/cooperatives/{cooperativeId}/documents:
 *   post:
 *     summary: Upload a cooperative document
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cooperativeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
uploadRouter.post(
  "/cooperatives/:cooperativeId/documents",
  authenticate,
  requireCooperativeManager,
  uploadSingleDocument,
  uploadCooperativeDocument
);

/**
 * @swagger
 * /api/v1/uploads/delete:
 *   delete:
 *     summary: Delete a file from storage (ADMIN only)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId]
 *             properties:
 *               publicId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
uploadRouter.delete("/delete", authenticate, requireAdmin, deleteUploadedFile);
