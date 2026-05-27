import { Router } from "express";

import {
  forgotPassword,
  getAuthUser,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
  refreshToken,
  logoutUser,
} from "../../controllers/auth.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authLimiter } from "../../middlewares/rateLimiting.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  forgotPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../../validators/user.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends an email verification link.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Kirenga Sam
 *               email:
 *                 type: string
 *                 example: sam@example.com
 *               phone:
 *                 type: string
 *                 example: "+250788123456"
 *               password:
 *                 type: string
 *                 example: Password123
 *               role:
 *                 type: string
 *                 enum: [FARMER, INSTITUTION, COOPERATIVE_MANAGER, GOVERNMENT_PARTNER]
 *                 example: FARMER
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or phone already exists
 *       429:
 *         description: Too many authentication attempts
 */
router.post("/register", authLimiter, validate(registerUserSchema), registerUser);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns an access token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: sam@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is not active
 *       429:
 *         description: Too many authentication attempts
 */
router.post("/login", authLimiter, validate(loginUserSchema), loginUser);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email if the account exists.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: sam@example.com
 *     responses:
 *       200:
 *         description: Password reset instructions sent if email exists
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many authentication attempts
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets password using token from email link.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, confirmPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: 8f2d9c2c1a3e
 *               password:
 *                 type: string
 *                 example: NewPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many authentication attempts
 */
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email
 *     description: Verifies user email using token from email link.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: 8f2d9c2c1a3e
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 *       429:
 *         description: Too many authentication attempts
 */
router.post(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  verifyEmail
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get authenticated user
 *     description: Returns the currently authenticated user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getAuthUser);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Issues a new access token using a valid refresh token. The refresh token is rotated on each use.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the user's refresh token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticate, logoutUser);

export default router;