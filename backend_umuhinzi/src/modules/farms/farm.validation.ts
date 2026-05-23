import { z } from "zod";
import { registry } from "../../docs/registry.js";
import { farmStatusValues, landUnitValues, ownershipTypeValues } from "./farm.schema.js";

export const landUnitSchema = z.enum(landUnitValues);

export const ownershipTypeSchema = z.enum(ownershipTypeValues);

export const farmStatusSchema = z.enum(farmStatusValues);

const latitudeSchema = z
  .number()
  .refine((value) => value >= -90 && value <= 90, {
    message: "Latitude must be between -90 and 90",
  });

const longitudeSchema = z
  .number()
  .refine((value) => value >= -180 && value <= 180, {
    message: "Longitude must be between -180 and 180",
  });

const baseFarmFields = {
  name: z.string().trim().min(3, "Farm name must be at least 3 characters"),
  landSize: z.number().positive("Land size must be positive"),
  landUnit: landUnitSchema,
  ownershipType: ownershipTypeSchema,
  soilType: z.string().trim().min(1, "Soil type is required"),
  province: z.string().trim().min(1, "Province is required"),
  district: z.string().trim().min(1, "District is required"),
  sector: z.string().trim().min(1, "Sector is required"),
  cell: z.string().trim().min(1, "Cell is required"),
  village: z.string().trim().min(1, "Village is required"),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  status: farmStatusSchema.optional(),
};

export const createFarmSchema = z.object({
  body: z.object({
    ...baseFarmFields,
    landUnit: landUnitSchema.optional().default("HECTARE"),
    ownershipType: ownershipTypeSchema.optional().default("OWNED"),
    status: farmStatusSchema.optional().default("ACTIVE"),
  }),
});

export const updateFarmSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farm ID"),
  }),
  body: z
    .object({
      name: z.string().trim().min(3, "Farm name must be at least 3 characters").optional(),
      landSize: z.number().positive("Land size must be positive").optional(),
      landUnit: landUnitSchema.optional(),
      ownershipType: ownershipTypeSchema.optional(),
      soilType: z.string().trim().min(1, "Soil type is required").optional(),
      province: z.string().trim().min(1, "Province is required").optional(),
      district: z.string().trim().min(1, "District is required").optional(),
      sector: z.string().trim().min(1, "Sector is required").optional(),
      cell: z.string().trim().min(1, "Cell is required").optional(),
      village: z.string().trim().min(1, "Village is required").optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
      status: farmStatusSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const farmIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farm ID"),
  }),
});

export const farmListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "name", "landSize", "district"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    status: farmStatusSchema.optional(),
    landUnit: landUnitSchema.optional(),
    ownershipType: ownershipTypeSchema.optional(),
    soilType: z.string().trim().optional(),
    province: z.string().trim().optional(),
    district: z.string().trim().optional(),
    sector: z.string().trim().optional(),
  }),
});

registry.register("CreateFarmInput", createFarmSchema);
registry.register("UpdateFarmInput", updateFarmSchema);
registry.register("FarmListQuery", farmListQuerySchema);

export type CreateFarmBody = z.infer<typeof createFarmSchema>["body"];
export type UpdateFarmBody = z.infer<typeof updateFarmSchema>["body"];
export type FarmListQueryInput = z.infer<typeof farmListQuerySchema>["query"];
