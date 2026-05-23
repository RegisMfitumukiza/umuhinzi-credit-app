import { z } from "zod";

export const landUnitValues = ["HECTARE", "ACRE"] as const;
export const ownershipTypeValues = ["OWNED", "RENTED", "FAMILY_LAND", "COOPERATIVE_LAND"] as const;
export const farmStatusValues = ["ACTIVE", "INACTIVE"] as const;

export const farmSchema = z.object({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  name: z.string(),
  landSize: z.number(),
  landUnit: z.enum(landUnitValues),
  ownershipType: z.enum(ownershipTypeValues),
  soilType: z.string(),
  province: z.string(),
  district: z.string(),
  sector: z.string(),
  cell: z.string(),
  village: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  status: z.enum(farmStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FarmSchema = z.infer<typeof farmSchema>;
