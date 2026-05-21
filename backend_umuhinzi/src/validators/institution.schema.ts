import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const institutionTypeSchema = z.enum([
  "SACCO",
  "MICROFINANCE",
  "BANK",
  "NGO",
  "GOVERNMENT_PROGRAM",
  "OTHER",
]);

export const institutionStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

/* ================= HELPERS ================= */

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => /^(\+?[0-9]{10,15})$/.test(value), {
    message: "Invalid phone number format",
  });

const emailSchema = z.email("Invalid email").trim().toLowerCase();

const registrationSchema = z
  .string()
  .trim()
  .min(3, "Registration number must be at least 3 characters")
  .max(100, "Registration number must not exceed 100 characters");

const licenseSchema = z
  .string()
  .trim()
  .min(3, "License number must be at least 3 characters")
  .max(100, "License number must not exceed 100 characters");

/* ================= CREATE ================= */

export const createInstitutionSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Institution name must be at least 2 characters")
      .max(150, "Institution name must not exceed 150 characters"),

    type: institutionTypeSchema,

    registrationNumber: registrationSchema.optional(),

    licenseNumber: licenseSchema.optional(),

    email: emailSchema.optional(),

    phone: phoneSchema.optional(),

    address: z.string().trim().max(255).optional(),

    province: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    sector: z.string().trim().max(100).optional(),
    cell: z.string().trim().max(100).optional(),
    village: z.string().trim().max(100).optional(),
  }),
});

/* ================= UPDATE ================= */

export const updateInstitutionSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid institution ID" }),
  }),

  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),

    type: institutionTypeSchema.optional(),

    registrationNumber: registrationSchema.optional(),

    licenseNumber: licenseSchema.optional(),

    email: emailSchema.optional(),

    phone: phoneSchema.optional(),

    address: z.string().trim().max(255).optional(),

    province: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    sector: z.string().trim().max(100).optional(),
    cell: z.string().trim().max(100).optional(),
    village: z.string().trim().max(100).optional(),
  }),
});

/* ================= STATUS ================= */

export const updateInstitutionStatusSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid institution ID" }),
  }),

  body: z.object({
    status: institutionStatusSchema,
  }),
});

/* ================= PARAMS ================= */

export const institutionIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid institution ID" }),
  }),
});

/* ================= SWAGGER ================= */

registry.register("CreateInstitutionInput", createInstitutionSchema);
registry.register("UpdateInstitutionInput", updateInstitutionSchema);
registry.register("UpdateInstitutionStatusInput", updateInstitutionStatusSchema);

/* ================= TYPES ================= */

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>["body"];

export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>["body"];

export type UpdateInstitutionStatusInput = z.infer<typeof updateInstitutionStatusSchema>["body"];