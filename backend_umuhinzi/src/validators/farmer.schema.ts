import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const genderSchema = z.enum([
  "MALE",
  "FEMALE",
  "OTHER",
]);

export const farmerStatusSchema = z.enum([
  "PENDING",
  "VERIFIED",
  "SUSPENDED",
]);

export const credibilityStatusSchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "TRUSTED",
]);

/* ================= HELPERS ================= */

const rwandaNationalIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^[0-9]{16}$/.test(value),
    {
      message: "National ID must contain exactly 16 digits",
    }
  );

const dateOfBirthSchema = z
  .coerce
  .date()
  .refine(
    (date) => date < new Date(),
    {
      message: "Date of birth must be in the past",
    }
  );

const experienceYearsSchema = z
  .number()
  .int()
  .min(0, "Experience cannot be negative")
  .max(80, "Experience years is too high");

/* ================= CREATE FARMER ================= */

export const createFarmerSchema = z.object({
  body: z.object({
    nationalId: rwandaNationalIdSchema,

    dateOfBirth: dateOfBirthSchema.optional(),

    gender: genderSchema.optional(),

    farmingExperienceYears: experienceYearsSchema.optional(),

    primaryCrop: z
      .string()
      .trim()
      .min(2, "Primary crop must be at least 2 characters")
      .max(100, "Primary crop must not exceed 100 characters")
      .optional(),

    cooperativeId: z
      .uuid("Invalid cooperative ID")
      .optional(),
  }),
});

/* ================= UPDATE FARMER ================= */

export const updateFarmerSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),

  body: z.object({
    nationalId: rwandaNationalIdSchema.optional(),

    dateOfBirth: dateOfBirthSchema.optional(),

    gender: genderSchema.optional(),

    farmingExperienceYears: experienceYearsSchema.optional(),

    primaryCrop: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    cooperativeId: z
      .uuid("Invalid cooperative ID")
      .nullable()
      .optional(),

    status: farmerStatusSchema.optional(),

    credibilityStatus: credibilityStatusSchema.optional(),
  }),
});

/* ================= GET FARMER BY ID ================= */

export const farmerIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),
});

/* ================= FARMER STATUS ================= */

export const updateFarmerStatusSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),

  body: z.object({
    status: farmerStatusSchema,
  }),
});

/* ================= FARMER CREDIBILITY ================= */

export const updateFarmerCredibilitySchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),

  body: z.object({
    credibilityStatus: credibilityStatusSchema,
  }),
});

/* ================= COOPERATIVE LINK ================= */

export const assignFarmerToCooperativeSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),

  body: z.object({
    cooperativeId: z.uuid("Invalid cooperative ID"),
  }),
});

export const removeFarmerFromCooperativeSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid farmer ID"),
  }),
});

/* ================= SWAGGER ================= */

registry.register(
  "CreateFarmerInput",
  createFarmerSchema
);

registry.register(
  "UpdateFarmerInput",
  updateFarmerSchema
);

registry.register(
  "UpdateFarmerStatusInput",
  updateFarmerStatusSchema
);

registry.register(
  "UpdateFarmerCredibilityInput",
  updateFarmerCredibilitySchema
);

registry.register(
  "AssignFarmerToCooperativeInput",
  assignFarmerToCooperativeSchema
);

/* ================= TYPES ================= */

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>["body"];

export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>["body"];

export type UpdateFarmerStatusInput = z.infer<typeof updateFarmerStatusSchema>["body"];

export type UpdateFarmerCredibilityInput = z.infer<typeof updateFarmerCredibilitySchema>["body"];

export type AssignFarmerToCooperativeInput = z.infer<typeof assignFarmerToCooperativeSchema>["body"];