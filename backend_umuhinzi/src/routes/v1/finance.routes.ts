import { Router } from "express";

import {
  createFarmExpense,
  getFarmExpenses,
  getFarmExpenseById,
  updateFarmExpense,
  deleteFarmExpense,
  createFinancialSummary,
  getFinancialSummaries,
  getFinancialSummaryById,
  updateFinancialSummary,
  deleteFinancialSummary,
  createMarketPrice,
  getMarketPrices,
  getMarketPriceById,
  updateMarketPrice,
  deleteMarketPrice,
} from "../../controllers/finance.controller.js";

import {
  authenticate,
  requireAdmin,
  requireFarmer,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createFarmExpenseSchema,
  updateFarmExpenseSchema,
  farmExpenseIdParamSchema,
  createFinancialSummarySchema,
  updateFinancialSummarySchema,
  financialSummaryIdParamSchema,
  createMarketPriceSchema,
  updateMarketPriceSchema,
  marketPriceIdParamSchema,
} from "../../validators/finance.schema.js";

/* ─────────────────────────────────────────
   EXPENSE ROUTES  /api/v1/expenses
───────────────────────────────────────── */

export const expenseRouter = Router();

/**
 * @swagger
 * /api/v1/expenses:
 *   post:
 *     summary: Create farm expense
 *     description: Logs a farm-level expense for the authenticated farmer. Optionally linked to a crop.
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, expenseDate]
 *             properties:
 *               cropId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [SEED, FERTILIZER, PESTICIDE, HERBICIDE, LABOR, IRRIGATION, TRANSPORT, EQUIPMENT, STORAGE, RENT, LOAN_REPAYMENT, OTHER]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               expenseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Farm expense created successfully
 */
expenseRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createFarmExpenseSchema),
  createFarmExpense
);

/**
 * @swagger
 * /api/v1/expenses:
 *   get:
 *     summary: Get farm expenses
 *     description: Farmers get their own expenses; admins get all.
 *     tags: [Expenses]
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
 *         name: cropId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Farm expenses fetched successfully
 */
expenseRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getFarmExpenses
);

/**
 * @swagger
 * /api/v1/expenses/{id}:
 *   get:
 *     summary: Get farm expense by ID
 *     tags: [Expenses]
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
 *         description: Farm expense fetched successfully
 */
expenseRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(farmExpenseIdParamSchema),
  getFarmExpenseById
);

/**
 * @swagger
 * /api/v1/expenses/{id}:
 *   patch:
 *     summary: Update farm expense
 *     tags: [Expenses]
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
 *         description: Farm expense updated successfully
 */
expenseRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateFarmExpenseSchema),
  updateFarmExpense
);

/**
 * @swagger
 * /api/v1/expenses/{id}:
 *   delete:
 *     summary: Delete farm expense
 *     tags: [Expenses]
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
 *         description: Farm expense deleted successfully
 */
expenseRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(farmExpenseIdParamSchema),
  deleteFarmExpense
);

/* ─────────────────────────────────────────
   FINANCIAL SUMMARY ROUTES  /api/v1/financial-summaries
───────────────────────────────────────── */

export const financialSummaryRouter = Router();

/**
 * @swagger
 * /api/v1/financial-summaries:
 *   post:
 *     summary: Create financial summary
 *     description: Creates a seasonal financial summary for the authenticated farmer. One per season.
 *     tags: [Financial Summaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seasonId]
 *             properties:
 *               seasonId:
 *                 type: string
 *                 format: uuid
 *               totalIncome:
 *                 type: number
 *               totalExpenses:
 *                 type: number
 *               netProfit:
 *                 type: number
 *               cashFlowStatus:
 *                 type: string
 *                 enum: [POSITIVE, NEUTRAL, NEGATIVE]
 *     responses:
 *       201:
 *         description: Financial summary created successfully
 *       409:
 *         description: Summary for this season already exists
 */
financialSummaryRouter.post(
  "/",
  authenticate,
  requireFarmer,
  validate(createFinancialSummarySchema),
  createFinancialSummary
);

/**
 * @swagger
 * /api/v1/financial-summaries:
 *   get:
 *     summary: Get financial summaries
 *     description: Farmers get their own; admins get all.
 *     tags: [Financial Summaries]
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
 *         description: Financial summaries fetched successfully
 */
financialSummaryRouter.get(
  "/",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  getFinancialSummaries
);

/**
 * @swagger
 * /api/v1/financial-summaries/{id}:
 *   get:
 *     summary: Get financial summary by ID
 *     tags: [Financial Summaries]
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
 *         description: Financial summary fetched successfully
 */
financialSummaryRouter.get(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(financialSummaryIdParamSchema),
  getFinancialSummaryById
);

/**
 * @swagger
 * /api/v1/financial-summaries/{id}:
 *   patch:
 *     summary: Update financial summary
 *     tags: [Financial Summaries]
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
 *         description: Financial summary updated successfully
 */
financialSummaryRouter.patch(
  "/:id",
  authenticate,
  requireFarmer,
  validate(updateFinancialSummarySchema),
  updateFinancialSummary
);

/**
 * @swagger
 * /api/v1/financial-summaries/{id}:
 *   delete:
 *     summary: Delete financial summary
 *     tags: [Financial Summaries]
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
 *         description: Financial summary deleted successfully
 */
financialSummaryRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("FARMER", "ADMIN"),
  validate(financialSummaryIdParamSchema),
  deleteFinancialSummary
);

/* ─────────────────────────────────────────
   MARKET PRICE ROUTES  /api/v1/market-prices
───────────────────────────────────────── */

export const marketPriceRouter = Router();

/**
 * @swagger
 * /api/v1/market-prices:
 *   post:
 *     summary: Create market price
 *     description: Records a market price for a crop. Admin only.
 *     tags: [Market Prices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cropName, marketLocation, pricePerUnit]
 *             properties:
 *               cropName:
 *                 type: string
 *               marketLocation:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               unit:
 *                 type: string
 *                 example: kg
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Market price created successfully
 */
marketPriceRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createMarketPriceSchema),
  createMarketPrice
);

/**
 * @swagger
 * /api/v1/market-prices:
 *   get:
 *     summary: Get market prices
 *     description: Returns all market prices. Accessible to all authenticated users. Supports filtering by cropName and marketLocation.
 *     tags: [Market Prices]
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
 *         name: cropName
 *         schema:
 *           type: string
 *       - in: query
 *         name: marketLocation
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Market prices fetched successfully
 */
marketPriceRouter.get("/", authenticate, getMarketPrices);

/**
 * @swagger
 * /api/v1/market-prices/{id}:
 *   get:
 *     summary: Get market price by ID
 *     tags: [Market Prices]
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
 *         description: Market price fetched successfully
 *       404:
 *         description: Not found
 */
marketPriceRouter.get(
  "/:id",
  authenticate,
  validate(marketPriceIdParamSchema),
  getMarketPriceById
);

/**
 * @swagger
 * /api/v1/market-prices/{id}:
 *   patch:
 *     summary: Update market price
 *     description: Admin only.
 *     tags: [Market Prices]
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
 *         description: Market price updated successfully
 */
marketPriceRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateMarketPriceSchema),
  updateMarketPrice
);

/**
 * @swagger
 * /api/v1/market-prices/{id}:
 *   delete:
 *     summary: Delete market price
 *     description: Admin only.
 *     tags: [Market Prices]
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
 *         description: Market price deleted successfully
 */
marketPriceRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(marketPriceIdParamSchema),
  deleteMarketPrice
);
