import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const expenseTypeSchema = z.enum([
  "SEED",
  "FERTILIZER",
  "PESTICIDE",
  "HERBICIDE",
  "LABOR",
  "IRRIGATION",
  "TRANSPORT",
  "EQUIPMENT",
  "STORAGE",
  "RENT",
  "LOAN_REPAYMENT",
  "OTHER",
]);

export const cashFlowStatusSchema = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

/* ================= HELPERS ================= */

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= FARM EXPENSE ================= */

export const createFarmExpenseSchema = z.object({
  body: z.object({
    cropId: uuidSchema("Invalid crop ID").optional(),
    type: expenseTypeSchema,
    amount: z.number().positive("Amount must be greater than 0"),
    description: z.string().trim().max(500).optional(),
    expenseDate: z.coerce.date(),
  }),
});

export const updateFarmExpenseSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid expense ID") }),
  body: z.object({
    cropId: uuidSchema("Invalid crop ID").optional(),
    type: expenseTypeSchema.optional(),
    amount: z.number().positive().optional(),
    description: z.string().trim().max(500).optional(),
    expenseDate: z.coerce.date().optional(),
  }),
});

export const farmExpenseIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid expense ID") }),
});

/* ================= FINANCIAL SUMMARY ================= */

export const createFinancialSummarySchema = z.object({
  body: z.object({
    seasonId: uuidSchema("Invalid season ID"),
    totalIncome: z.number().min(0).default(0).optional(),
    totalExpenses: z.number().min(0).default(0).optional(),
    netProfit: z.number().default(0).optional(),
    cashFlowStatus: cashFlowStatusSchema.default("NEUTRAL").optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const updateFinancialSummarySchema = z.object({
  params: z.object({ id: uuidSchema("Invalid financial summary ID") }),
  body: z.object({
    totalIncome: z.number().min(0).optional(),
    totalExpenses: z.number().min(0).optional(),
    netProfit: z.number().optional(),
    cashFlowStatus: cashFlowStatusSchema.optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const financialSummaryIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid financial summary ID") }),
});

/* ================= MARKET PRICE ================= */

export const createMarketPriceSchema = z.object({
  body: z.object({
    cropName: z.string().trim().min(1, "Crop name is required").max(100),
    marketLocation: z.string().trim().min(1, "Market location is required").max(200),
    pricePerUnit: z.number().positive("Price per unit must be greater than 0"),
    unit: z.string().trim().min(1).max(20).default("kg").optional(),
    recordedAt: z.coerce.date().optional(),
  }),
});

export const updateMarketPriceSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid market price ID") }),
  body: z.object({
    cropName: z.string().trim().min(1).max(100).optional(),
    marketLocation: z.string().trim().min(1).max(200).optional(),
    pricePerUnit: z.number().positive().optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    recordedAt: z.coerce.date().optional(),
  }),
});

export const marketPriceIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid market price ID") }),
});

/* ================= SWAGGER ================= */

registry.register("CreateFarmExpenseInput", createFarmExpenseSchema);
registry.register("UpdateFarmExpenseInput", updateFarmExpenseSchema);
registry.register("CreateFinancialSummaryInput", createFinancialSummarySchema);
registry.register("UpdateFinancialSummaryInput", updateFinancialSummarySchema);
registry.register("CreateMarketPriceInput", createMarketPriceSchema);
registry.register("UpdateMarketPriceInput", updateMarketPriceSchema);

/* ================= TYPES ================= */

export type CreateFarmExpenseInput = z.infer<typeof createFarmExpenseSchema>["body"];
export type UpdateFarmExpenseInput = z.infer<typeof updateFarmExpenseSchema>["body"];
export type CreateFinancialSummaryInput = z.infer<typeof createFinancialSummarySchema>["body"];
export type UpdateFinancialSummaryInput = z.infer<typeof updateFinancialSummarySchema>["body"];
export type CreateMarketPriceInput = z.infer<typeof createMarketPriceSchema>["body"];
export type UpdateMarketPriceInput = z.infer<typeof updateMarketPriceSchema>["body"];
