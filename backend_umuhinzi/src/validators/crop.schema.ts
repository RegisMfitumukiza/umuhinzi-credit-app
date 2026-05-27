import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const cropTypeSchema = z.enum([
  "CEREAL",
  "LEGUME",
  "VEGETABLE",
  "FRUIT",
  "ROOT_TUBER",
  "CASH_CROP",
  "OTHER",
]);

export const cropStatusSchema = z.enum([
  "PLANNED",
  "PLANTED",
  "GROWING",
  "HARVESTED",
  "FAILED",
]);

/* ================= HELPERS ================= */

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= CREATE CROP ================= */

export const createCropSchema = z.object({
  body: z.object({
    farmId: uuidSchema("Invalid farm ID"),

    seasonId: uuidSchema("Invalid season ID"),

    cropName: z
      .string()
      .trim()
      .min(2, "Crop name must be at least 2 characters")
      .max(100, "Crop name must not exceed 100 characters"),

    cropType: cropTypeSchema,

    plantingDate: z.coerce.date(),

    expectedHarvestDate: z.coerce.date().optional(),

    estimatedArea: z
      .number()
      .positive("Estimated area must be greater than 0")
      .optional(),

    notes: z.string().trim().max(500).optional(),
  }),
});

/* ================= UPDATE CROP ================= */

export const updateCropSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid crop ID"),
  }),

  body: z.object({
    cropName: z.string().trim().min(2).max(100).optional(),

    cropType: cropTypeSchema.optional(),

    plantingDate: z.coerce.date().optional(),

    expectedHarvestDate: z.coerce.date().optional(),

    actualHarvestDate: z.coerce.date().optional(),

    estimatedArea: z.number().positive().optional(),

    status: cropStatusSchema.optional(),

    notes: z.string().trim().max(500).optional(),
  }),
});

/* ================= PARAMS ================= */

export const cropIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid crop ID"),
  }),
});

/* ================= FARMING SEASON: CREATE ================= */

export const createSeasonSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Season name is required")
        .max(100, "Season name must not exceed 100 characters"),

      year: z
        .number()
        .int("Year must be an integer")
        .min(2000, "Year must be 2000 or later")
        .max(2100, "Year must be 2100 or earlier"),

      startDate: z.coerce.date(),

      endDate: z.coerce.date(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: "End date must be after start date",
      path: ["endDate"],
    }),
});

/* ================= FARMING SEASON: PARAMS ================= */

export const seasonIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid season ID"),
  }),
});

/* ================= SWAGGER ================= */

registry.register("CreateCropInput", createCropSchema);
registry.register("UpdateCropInput", updateCropSchema);
registry.register("CreateSeasonInput", createSeasonSchema);

/* ================= TYPES ================= */

export type CreateCropInput = z.infer<typeof createCropSchema>["body"];
export type UpdateCropInput = z.infer<typeof updateCropSchema>["body"];
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>["body"];
