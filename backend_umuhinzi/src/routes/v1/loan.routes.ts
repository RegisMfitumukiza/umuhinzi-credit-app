import { Router } from "express";

import {
  createLoanApplication,
  updateLoanApplicationStatus,
  getLoanApplications,
  getLoanApplicationById,
  deleteLoanApplication,
  getLoans,
  getLoanById,
  disburseLoan,
  updateLoanStatus,
  createRepayment,
  getRepayments,
  getRepaymentById,
  getRepaymentSchedules,
  getRepaymentScheduleById,
} from "../../controllers/loan.controller.js";

import {
  authenticate,
  requireFarmer,
  requireAdmin,
  requireAdminOrInstitution,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createLoanApplicationSchema,
  updateLoanApplicationStatusSchema,
  loanApplicationIdParamSchema,
  disburseLoanSchema,
  updateLoanStatusSchema,
  loanIdParamSchema,
  createRepaymentSchema,
  repaymentIdParamSchema,
  repaymentScheduleIdParamSchema,
} from "../../validators/loan.schema.js";

/* ─────────────────────────────────────────
   LOAN APPLICATIONS  /api/v1/loan-applications
───────────────────────────────────────── */

export const loanApplicationRouter = Router();

/**
 * @swagger
 * /api/v1/loan-applications:
 *   post:
 *     summary: Submit a loan application
 *     description: Farmer submits a loan application with an optional institution and credit score reference.
 *     tags: [Loan Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestedAmount, purpose]
 *             properties:
 *               institutionId:
 *                 type: string
 *                 format: uuid
 *               creditScoreId:
 *                 type: string
 *                 format: uuid
 *               requestedAmount:
 *                 type: number
 *               purpose:
 *                 type: string
 *                 enum: [SEEDS, FERTILIZER, EQUIPMENT, IRRIGATION, LIVESTOCK, LAND_RENT, LABOR, TRANSPORT, STORAGE, OTHER]
 *               purposeDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Loan application submitted successfully
 *       404:
 *         description: Farmer profile or institution not found
 */
loanApplicationRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createLoanApplicationSchema),
  createLoanApplication
);

/**
 * @swagger
 * /api/v1/loan-applications:
 *   get:
 *     summary: Get loan applications
 *     description: Farmers see their own. Admins and institutions see all (with optional status/farmerId filters).
 *     tags: [Loan Applications]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loan applications fetched successfully
 */
loanApplicationRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN", "INSTITUTION"),
  getLoanApplications
);

/**
 * @swagger
 * /api/v1/loan-applications/{id}:
 *   get:
 *     summary: Get loan application by ID
 *     description: Farmers can only access their own applications. Institutions see applications for their institution.
 *     tags: [Loan Applications]
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
 *         description: Loan application fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
loanApplicationRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN", "INSTITUTION"),
  validate(loanApplicationIdParamSchema),
  getLoanApplicationById
);

/**
 * @swagger
 * /api/v1/loan-applications/{id}/status:
 *   patch:
 *     summary: Update loan application status
 *     description: Admin/Institution move through PENDING → UNDER_REVIEW → APPROVED/REJECTED. Farmers can cancel (CANCELLED) their own PENDING application.
 *     tags: [Loan Applications]
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
 *                 enum: [UNDER_REVIEW, APPROVED, REJECTED, CANCELLED]
 *               rejectionReason:
 *                 type: string
 *               approvedAmount:
 *                 type: number
 *               recommendedAmount:
 *                 type: number
 *               interestRate:
 *                 type: number
 *               totalPayable:
 *                 type: number
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Not authorized
 */
loanApplicationRouter.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("FARMER", "ADMIN", "INSTITUTION"),
  validate(updateLoanApplicationStatusSchema),
  updateLoanApplicationStatus
);

/**
 * @swagger
 * /api/v1/loan-applications/{id}:
 *   delete:
 *     summary: Delete a PENDING loan application
 *     description: Farmers can delete their own PENDING applications only.
 *     tags: [Loan Applications]
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
 *         description: Loan application deleted successfully
 *       400:
 *         description: Can only delete PENDING applications
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
loanApplicationRouter.delete(
  "/:id",
  authenticate,
  requireFarmer,
  validate(loanApplicationIdParamSchema),
  deleteLoanApplication
);

/* ─────────────────────────────────────────
   LOANS  /api/v1/loans
───────────────────────────────────────── */

export const loanRouter = Router();

/**
 * @swagger
 * /api/v1/loans:
 *   get:
 *     summary: Get loans
 *     description: Farmers see their own loans. Admins and institutions see all (with optional status/farmerId filters).
 *     tags: [Loans]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [APPROVED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED, CANCELLED]
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loans fetched successfully
 */
loanRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN", "INSTITUTION"),
  getLoans
);

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   get:
 *     summary: Get loan by ID
 *     description: Returns full loan with repayment schedules. Farmers see own loans only.
 *     tags: [Loans]
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
 *         description: Loan fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
loanRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN", "INSTITUTION"),
  validate(loanIdParamSchema),
  getLoanById
);

/**
 * @swagger
 * /api/v1/loans/{id}/disburse:
 *   patch:
 *     summary: Disburse a loan
 *     description: Admin or institution disburses an APPROVED loan. Generates monthly repayment schedules automatically.
 *     tags: [Loans]
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
 *             required: [disbursedAmount, startDate, durationMonths]
 *             properties:
 *               disbursedAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               durationMonths:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *     responses:
 *       200:
 *         description: Loan disbursed successfully
 *       400:
 *         description: Loan is not in APPROVED status
 *       404:
 *         description: Loan not found
 */
loanRouter.patch(
  "/:id/disburse",
  authenticate,
  requireAdminOrInstitution,
  validate(disburseLoanSchema),
  disburseLoan
);

/**
 * @swagger
 * /api/v1/loans/{id}/status:
 *   patch:
 *     summary: Update loan status (Admin only)
 *     description: Admin manually transitions loan status (ACTIVE, COMPLETED, DEFAULTED, CANCELLED).
 *     tags: [Loans]
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
 *                 enum: [ACTIVE, COMPLETED, DEFAULTED, CANCELLED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Loan status updated successfully
 *       400:
 *         description: Invalid status transition
 */
loanRouter.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateLoanStatusSchema),
  updateLoanStatus
);

/* ─────────────────────────────────────────
   REPAYMENTS  /api/v1/repayments
───────────────────────────────────────── */

export const repaymentRouter = Router();

/**
 * @swagger
 * /api/v1/repayments:
 *   post:
 *     summary: Record a repayment
 *     description: Farmer records a payment against an ACTIVE loan. Optionally links to a specific repayment schedule installment.
 *     tags: [Repayments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loanId, amountPaid, paymentMethod]
 *             properties:
 *               loanId:
 *                 type: string
 *                 format: uuid
 *               repaymentScheduleId:
 *                 type: string
 *                 format: uuid
 *               amountPaid:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [MOBILE_MONEY, BANK_TRANSFER, CASH, CARD, OTHER]
 *               transactionReference:
 *                 type: string
 *               notes:
 *                 type: string
 *               paidAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Repayment recorded successfully
 *       400:
 *         description: Loan is not ACTIVE or schedule already paid
 *       409:
 *         description: Duplicate transaction reference
 */
repaymentRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createRepaymentSchema),
  createRepayment
);

/**
 * @swagger
 * /api/v1/repayments:
 *   get:
 *     summary: Get repayments
 *     description: Farmers see their own repayments; admins see all. Optional loanId filter.
 *     tags: [Repayments]
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
 *         name: loanId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Repayments fetched successfully
 */
repaymentRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getRepayments
);

/**
 * @swagger
 * /api/v1/repayments/{id}:
 *   get:
 *     summary: Get repayment by ID
 *     description: Farmers can only access their own repayments.
 *     tags: [Repayments]
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
 *         description: Repayment fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
repaymentRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(repaymentIdParamSchema),
  getRepaymentById
);

/* ─────────────────────────────────────────
   REPAYMENT SCHEDULES  /api/v1/repayment-schedules
───────────────────────────────────────── */

export const repaymentScheduleRouter = Router();

/**
 * @swagger
 * /api/v1/repayment-schedules:
 *   get:
 *     summary: Get repayment schedules
 *     description: Farmers see their own schedules; admins see all. Optional loanId filter.
 *     tags: [Repayment Schedules]
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
 *         name: loanId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Repayment schedules fetched successfully
 */
repaymentScheduleRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getRepaymentSchedules
);

/**
 * @swagger
 * /api/v1/repayment-schedules/{id}:
 *   get:
 *     summary: Get repayment schedule by ID
 *     description: Farmers can only access their own schedules.
 *     tags: [Repayment Schedules]
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
 *         description: Repayment schedule fetched successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Not found
 */
repaymentScheduleRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(repaymentScheduleIdParamSchema),
  getRepaymentScheduleById
);
