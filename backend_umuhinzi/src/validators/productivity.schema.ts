import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const yieldQualityGradeSchema = z.enum([
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "POOR",
  "DAMAGED",
]);

export const inputTypeSchema = z.enum([
  "SEED",
  "FERTILIZER",
  "PESTICIDE",
  "HERBICIDE",
  "LABOR",
  "IRRIGATION",
  "TRANSPORT",
  "EQUIPMENT",
  "STORAGE",
  "OTHER",
]);

/* ================= HELPERS ================= */

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= YIELD RECORD ================= */

export const createYieldRecordSchema = z.object({
  body: z.object({
    cropId: uuidSchema("Invalid crop ID"),
    expectedYield: z.number().positive("Expected yield must be greater than 0").optional(),
    actualYield: z.number().positive("Actual yield must be greater than 0"),
    unit: z.string().trim().min(1).max(20).default("kg").optional(),
    harvestDate: z.coerce.date(),
    qualityGrade: yieldQualityGradeSchema.default("AVERAGE").optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const updateYieldRecordSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid yield record ID") }),
  body: z.object({
    expectedYield: z.number().positive().optional(),
    actualYield: z.number().positive().optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    harvestDate: z.coerce.date().optional(),
    qualityGrade: yieldQualityGradeSchema.optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const yieldRecordIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid yield record ID") }),
});

/* ================= INPUT COST ================= */

export const createInputCostSchema = z.object({
  body: z.object({
    cropId: uuidSchema("Invalid crop ID"),
    type: inputTypeSchema,
    name: z.string().trim().min(1, "Name is required").max(100),
    description: z.string().trim().max(500).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().trim().max(50).optional(),
    unitCost: z.number().positive().optional(),
    totalCost: z.number().positive("Total cost must be greater than 0"),
    dateUsed: z.coerce.date(),
  }),
});

export const updateInputCostSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid input cost ID") }),
  body: z.object({
    type: inputTypeSchema.optional(),
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().trim().max(50).optional(),
    unitCost: z.number().positive().optional(),
    totalCost: z.number().positive().optional(),
    dateUsed: z.coerce.date().optional(),
  }),
});

export const inputCostIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid input cost ID") }),
});

/* ================= PRODUCTIVITY RECORD ================= */

export const createProductivityRecordSchema = z.object({
  body: z.object({
    seasonId: uuidSchema("Invalid season ID"),
    totalExpectedYield: z.number().positive().optional(),
    totalActualYield: z.number().positive("Total actual yield must be greater than 0"),
    unit: z.string().trim().min(1).max(20).default("kg").optional(),
    productivityRate: z.number().min(0, "Productivity rate must be non-negative"),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const updateProductivityRecordSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid productivity record ID") }),
  body: z.object({
    totalExpectedYield: z.number().positive().optional(),
    totalActualYield: z.number().positive().optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    productivityRate: z.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const productivityRecordIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid productivity record ID") }),
});

/* ================= SWAGGER ================= */

registry.register("CreateYieldRecordInput", createYieldRecordSchema);
registry.register("UpdateYieldRecordInput", updateYieldRecordSchema);
registry.register("CreateInputCostInput", createInputCostSchema);
registry.register("UpdateInputCostInput", updateInputCostSchema);
registry.register("CreateProductivityRecordInput", createProductivityRecordSchema);
registry.register("UpdateProductivityRecordInput", updateProductivityRecordSchema);

/* ================= TYPES ================= */

export type CreateYieldRecordInput = z.infer<typeof createYieldRecordSchema>["body"];
export type UpdateYieldRecordInput = z.infer<typeof updateYieldRecordSchema>["body"];
export type CreateInputCostInput = z.infer<typeof createInputCostSchema>["body"];
export type UpdateInputCostInput = z.infer<typeof updateInputCostSchema>["body"];
export type CreateProductivityRecordInput = z.infer<typeof createProductivityRecordSchema>["body"];
export type UpdateProductivityRecordInput = z.infer<typeof updateProductivityRecordSchema>["body"];
