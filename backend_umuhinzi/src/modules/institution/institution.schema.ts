import { z } from "zod";
import { registry } from "../../docs/registry.js";

export const InstitutionTypeEnum = z.enum([
  "SACCO", "MICROFINANCE", "BANK", "NGO", "GOVERNMENT_PROGRAM", "OTHER",
]);

export const InstitutionStatusEnum = z.enum([
  "PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED",
]);

export const CreateInstitutionSchema = z.object({
  name: z.string().min(2).max(100).openapi({ example: "Rwanda Development Bank" }),
  type: InstitutionTypeEnum.openapi({ example: "BANK" }),
  licenseNumber: z.string().min(3).max(50).optional().openapi({ example: "LIC-2024-001" }),
  registrationNumber: z.string().min(3).max(50).optional().openapi({ example: "REG-2024-001" }),
  email: z.string().email().optional().openapi({ example: "info@rdb.rw" }),
  phone: z.string().regex(/^\+?[0-9\s\-]{7,20}$/).optional().openapi({ example: "+250788000000" }),
  address: z.string().min(5).max(255).optional().openapi({ example: "KG 7 Ave, Kigali" }),
  province: z.string().optional().openapi({ example: "Kigali" }),
  district: z.string().optional().openapi({ example: "Nyarugenge" }),
  sector: z.string().optional().openapi({ example: "Nyarugenge" }),
  cell: z.string().optional().openapi({ example: "Biryogo" }),
  village: z.string().optional().openapi({ example: "Kimisange" }),
}).openapi("CreateInstitution");

export const UpdateInstitutionSchema = CreateInstitutionSchema.partial().openapi("UpdateInstitution");

export const UpdateInstitutionStatusSchema = z.object({
  status: InstitutionStatusEnum.openapi({ example: "ACTIVE" }),
  reason: z.string().max(500).optional().openapi({ example: "Passed compliance review." }),
}).openapi("UpdateInstitutionStatus");

registry.register("CreateInstitution", CreateInstitutionSchema);
registry.register("UpdateInstitution", UpdateInstitutionSchema);
registry.register("UpdateInstitutionStatus", UpdateInstitutionStatusSchema);

export type CreateInstitutionDto = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionDto = z.infer<typeof UpdateInstitutionSchema>;
export type UpdateInstitutionStatusDto = z.infer<typeof UpdateInstitutionStatusSchema>;
