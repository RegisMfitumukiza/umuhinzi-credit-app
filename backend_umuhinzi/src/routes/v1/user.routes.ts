import { Router } from "express";

import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getUserById,
  getUserStats,
  updateUserAvatar,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
  provisionAccount,
} from "../../controllers/user.controller.js";

import {
  authenticate,
  requireAdmin,
} from "../../middlewares/auth.middleware.js";

import { uploadUserAvatar } from "../../middlewares/upload.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  updateUserProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "../../validators/user.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile of the currently authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile information.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Kirenga Sam
 *               phone:
 *                 type: string
 *                 example: "+250788123456"
 *               province:
 *                 type: string
 *                 example: Kigali City
 *               district:
 *                 type: string
 *                 example: Gasabo
 *               sector:
 *                 type: string
 *                 example: Kacyiru
 *               cell:
 *                 type: string
 *                 example: Kamutwa
 *               village:
 *                 type: string
 *                 example: Umutekano
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Phone number already exists
 */
router.patch(
  "/me",
  authenticate,
  validate(updateUserProfileSchema),
  updateUserProfile
);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   patch:
 *     summary: Update user avatar
 *     description: Uploads or updates the authenticated user's profile image.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Avatar image is required or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.patch("/me/avatar", authenticate, uploadUserAvatar, updateUserAvatar);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns user counts grouped by role and status. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/stats", authenticate, requireAdmin, getUserStats);

/**
 * @swagger
 * /api/v1/users/provision:
 *   post:
 *     summary: Provision INSTITUTION or GOVERNMENT_PARTNER account (Admin only)
 *     description: Admin creates a new account, sets it ACTIVE, and emails the user their credentials and login URL.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, role]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [INSTITUTION, GOVERNMENT_PARTNER]
 *     responses:
 *       201:
 *         description: Account created and credentials emailed
 *       400:
 *         description: Missing required fields or invalid role
 *       409:
 *         description: Email already exists
 */
router.post("/provision", authenticate, requireAdmin, provisionAccount);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Returns paginated users with optional filters. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [FARMER, INSTITUTION, COOPERATIVE_MANAGER, ADMIN, GOVERNMENT_PARTNER]
 *         description: Filter users by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, SUSPENDED, DEACTIVATED]
 *         description: Filter users by status
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: Gasabo
 *         description: Filter users by district
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: sam
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", authenticate, requireAdmin, getAllUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a single user by ID. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  validate(userIdParamSchema),
  getUserById
);

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Updates a user's account status. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
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
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid user ID or status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateUserStatusSchema),
  updateUserStatus
);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     description: Updates a user's role. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [FARMER, INSTITUTION, COOPERATIVE_MANAGER, ADMIN, GOVERNMENT_PARTNER]
 *                 example: FARMER
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid user ID or role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/role",
  authenticate,
  requireAdmin,
  validate(updateUserRoleSchema),
  updateUserRole
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Deletes a user account. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(userIdParamSchema),
  deleteUser
);

export default router;