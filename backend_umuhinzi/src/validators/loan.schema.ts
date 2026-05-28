import { z } from "zod";
import { registry } from "../docs/registry.js";

const uuidSchema = (message: string) => z.uuid({ message });

export const loanPurposeSchema = z.enum([
  "SEEDS",
  "FERTILIZER",
  "EQUIPMENT",
  "IRRIGATION",
  "LIVESTOCK",
  "LAND_RENT",
  "LABOR",
  "TRANSPORT",
  "STORAGE",
  "OTHER",
]);

export const paymentMethodSchema = z.enum([
  "MOBILE_MONEY",
  "BANK_TRANSFER",
  "CASH",
  "CARD",
  "OTHER",
]);

/* ================= LOAN APPLICATION ================= */

export const createLoanApplicationSchema = z.object({
  body: z.object({
    institutionId: uuidSchema("Invalid institution ID").optional(),
    creditScoreId: uuidSchema("Invalid credit score ID").optional(),
    requestedAmount: z.number().positive("Requested amount must be greater than 0"),
    purpose: loanPurposeSchema,
    purposeDescription: z.string().trim().max(500).optional(),
  }),
});

export const updateLoanApplicationStatusSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid loan application ID") }),
  body: z.object({
    status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
    recommendedAmount: z.number().positive().optional(),
    approvedAmount: z.number().positive().optional(),
    interestRate: z.number().min(0).max(100).optional(),
    totalPayable: z.number().positive().optional(),
  }),
});

export const loanApplicationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid loan application ID") }),
});

/* ================= LOAN ================= */

export const disburseLoanSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid loan ID") }),
  body: z.object({
    disbursedAmount: z.number().positive("Disbursed amount must be greater than 0"),
    startDate: z.coerce.date(),
    durationMonths: z
      .number()
      .int()
      .min(1, "Duration must be at least 1 month")
      .max(120, "Duration cannot exceed 120 months"),
  }),
});

export const updateLoanStatusSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid loan ID") }),
  body: z.object({
    status: z.enum(["ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"]),
    note: z.string().trim().max(500).optional(),
  }),
});

export const loanIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid loan ID") }),
});

/* ================= REPAYMENT ================= */

export const createRepaymentSchema = z.object({
  body: z.object({
    loanId: uuidSchema("Invalid loan ID"),
    repaymentScheduleId: uuidSchema("Invalid repayment schedule ID").optional(),
    amountPaid: z.number().positive("Amount paid must be greater than 0"),
    paymentMethod: paymentMethodSchema,
    transactionReference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
    paidAt: z.coerce.date().optional(),
  }),
});

export const repaymentIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid repayment ID") }),
});

export const repaymentScheduleIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid repayment schedule ID") }),
});

/* ================= SWAGGER ================= */

registry.register("CreateLoanApplicationInput", createLoanApplicationSchema);
registry.register("UpdateLoanApplicationStatusInput", updateLoanApplicationStatusSchema);
registry.register("DisburseLoanInput", disburseLoanSchema);
registry.register("UpdateLoanStatusInput", updateLoanStatusSchema);
registry.register("CreateRepaymentInput", createRepaymentSchema);

/* ================= TYPES ================= */

export type CreateLoanApplicationInput = z.infer<typeof createLoanApplicationSchema>["body"];
export type UpdateLoanApplicationStatusInput = z.infer<typeof updateLoanApplicationStatusSchema>["body"];
export type DisburseLoanInput = z.infer<typeof disburseLoanSchema>["body"];
export type UpdateLoanStatusInput = z.infer<typeof updateLoanStatusSchema>["body"];
export type CreateRepaymentInput = z.infer<typeof createRepaymentSchema>["body"];
