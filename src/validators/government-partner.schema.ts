import { z } from "zod";

const govEmailSchema = z
  .email("Invalid email")
  .trim()
  .toLowerCase()
  .refine((email) => /\.gov\.rw$/.test(email), {
    message: "Government partner email must be an official .gov.rw address",
  });

export const createGovernmentPartnerSchema = z.object({
  body: z.object({
    organizationName: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters")
      .max(200, "Organization name must not exceed 200 characters"),
    department: z
      .string()
      .trim()
      .min(2, "Department must be at least 2 characters")
      .max(200, "Department must not exceed 200 characters"),
    officialEmail: govEmailSchema,
    mouReference: z.string().trim().max(200).optional(),
    accessPurpose: z
      .string()
      .trim()
      .min(10, "Access purpose must be at least 10 characters")
      .max(1000, "Access purpose must not exceed 1000 characters"),
  }),
});

export const updateGovernmentPartnerStatusSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid government partner ID" }),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "REJECTED", "REVOKED"]),
    adminNote: z.string().trim().max(500).optional(),
  }),
});

export const governmentPartnerIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid government partner ID" }),
  }),
});

export type CreateGovernmentPartnerInput = z.infer<typeof createGovernmentPartnerSchema>["body"];
export type UpdateGovernmentPartnerStatusInput = z.infer<typeof updateGovernmentPartnerStatusSchema>["body"];
