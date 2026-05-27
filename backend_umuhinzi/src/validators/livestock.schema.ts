import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const livestockTypeSchema = z.enum([
  "CATTLE",
  "GOAT",
  "SHEEP",
  "PIG",
  "CHICKEN",
  "DUCK",
  "RABBIT",
  "FISH",
  "BEE",
  "OTHER",
]);

export const livestockPurposeSchema = z.enum([
  "MILK",
  "MEAT",
  "EGGS",
  "BREEDING",
  "FARM_WORK",
  "COMMERCIAL",
  "OTHER",
]);

export const livestockStatusSchema = z.enum([
  "ACTIVE",
  "SOLD",
  "DECEASED",
  "INACTIVE",
]);

/* ================= HELPERS ================= */

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= CREATE LIVESTOCK ================= */

export const createLivestockSchema = z.object({
  body: z.object({
    type: livestockTypeSchema,

    purpose: livestockPurposeSchema.default("COMMERCIAL").optional(),

    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .positive("Quantity must be at least 1")
      .default(1)
      .optional(),

    estimatedValue: z
      .number()
      .positive("Estimated value must be greater than 0")
      .optional(),

    notes: z.string().trim().max(500).optional(),
  }),
});

/* ================= UPDATE LIVESTOCK ================= */

export const updateLivestockSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid livestock ID"),
  }),

  body: z.object({
    type: livestockTypeSchema.optional(),

    purpose: livestockPurposeSchema.optional(),

    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .positive("Quantity must be at least 1")
      .optional(),

    estimatedValue: z.number().positive().optional(),

    notes: z.string().trim().max(500).optional(),

    status: livestockStatusSchema.optional(),
  }),
});

/* ================= PARAMS ================= */

export const livestockIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid livestock ID"),
  }),
});

/* ================= SWAGGER ================= */

registry.register("CreateLivestockInput", createLivestockSchema);
registry.register("UpdateLivestockInput", updateLivestockSchema);

/* ================= TYPES ================= */

export type CreateLivestockInput = z.infer<typeof createLivestockSchema>["body"];
export type UpdateLivestockInput = z.infer<typeof updateLivestockSchema>["body"];
