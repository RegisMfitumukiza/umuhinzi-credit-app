import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const landUnitSchema = z.enum([
  "HECTARE",
  "ACRE",
  "SQUARE_METER",
]);

export const ownershipTypeSchema = z.enum([
  "OWNED",
  "RENTED",
  "FAMILY_LAND",
  "COOPERATIVE_LAND",
  "GOVERNMENT_ALLOCATED",
  "OTHER",
]);

export const soilTypeSchema = z.enum([
  "CLAY",
  "SANDY",
  "SILT",
  "LOAM",
  "PEAT",
  "CHALKY",
  "UNKNOWN",
]);

export const farmStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "UNDER_REVIEW",
]);

/* ================= HELPERS ================= */

const uuidSchema = (message: string) =>
  z.uuid({ message });

const latitudeSchema = z
  .number()
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

const longitudeSchema = z
  .number()
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

const landSizeSchema = z
  .number()
  .positive("Land size must be greater than 0")
  .max(100000, "Land size is too large");

/* ================= CREATE FARM ================= */

export const createFarmSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Farm name must be at least 2 characters")
      .max(150, "Farm name must not exceed 150 characters"),

    description: z.string().trim().max(500).optional(),

    landSize: landSizeSchema,

    landUnit: landUnitSchema.default("HECTARE").optional(),

    ownershipType: ownershipTypeSchema.default("OWNED").optional(),

    soilType: soilTypeSchema.default("UNKNOWN").optional(),

    province: z.string().trim().max(100).optional(),

    district: z
      .string()
      .trim()
      .min(2, "District is required")
      .max(100),

    sector: z.string().trim().max(100).optional(),

    cell: z.string().trim().max(100).optional(),

    village: z.string().trim().max(100).optional(),

    latitude: latitudeSchema.optional(),

    longitude: longitudeSchema.optional(),
  }),
});

/* ================= UPDATE FARM ================= */

export const updateFarmSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid farm ID"),
  }),

  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),

    description: z.string().trim().max(500).optional(),

    landSize: landSizeSchema.optional(),

    landUnit: landUnitSchema.optional(),

    ownershipType: ownershipTypeSchema.optional(),

    soilType: soilTypeSchema.optional(),

    province: z.string().trim().max(100).optional(),

    district: z.string().trim().min(2).max(100).optional(),

    sector: z.string().trim().max(100).optional(),

    cell: z.string().trim().max(100).optional(),

    village: z.string().trim().max(100).optional(),

    latitude: latitudeSchema.optional(),

    longitude: longitudeSchema.optional(),
  }),
});

/* ================= STATUS ================= */

export const updateFarmStatusSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid farm ID"),
  }),

  body: z.object({
    status: farmStatusSchema,
  }),
});

/* ================= PARAMS ================= */

export const farmIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid farm ID"),
  }),
});

/* ================= SWAGGER ================= */

registry.register("CreateFarmInput", createFarmSchema);
registry.register("UpdateFarmInput", updateFarmSchema);
registry.register("UpdateFarmStatusInput", updateFarmStatusSchema);

/* ================= TYPES ================= */

export type CreateFarmInput = z.infer<typeof createFarmSchema>["body"];
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>["body"];
export type UpdateFarmStatusInput = z.infer<typeof updateFarmStatusSchema>["body"];