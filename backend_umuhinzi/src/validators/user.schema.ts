import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const roleSchema = z.enum([
  "FARMER",
  "INSTITUTION",
  "COOPERATIVE_MANAGER",
  "ADMIN",
  "GOVERNMENT_PARTNER",
]);

export const userStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

/* ================= HELPERS ================= */

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must not exceed 100 characters")
  .refine(
    (value) =>
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(value),
    {
      message: "Password must contain uppercase, lowercase, a number and a special character",
    }
  );

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => /^(\+?[0-9]{10,15})$/.test(value), {
    message: "Invalid phone number format",
  });

const cloudinaryImageSchema = z
  .url("Invalid image URL")
  .refine(
    (url) => url.includes("cloudinary") || url.includes("res.cloudinary"),
    {
      message: "Image must be hosted on Cloudinary",
    }
  );

/* ================= REGISTER ================= */

export const registerUserSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),

    email: z.email("Invalid email").trim().toLowerCase(),

    phone: phoneSchema.optional(),

    password: passwordSchema,

    role: roleSchema
      .refine((role) => role !== "ADMIN", {
        message: "Admin accounts cannot self-register",
      })
      .optional(),
  }),
});

/* ================= LOGIN ================= */

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").trim().toLowerCase(),

    password: z.string().min(1, "Password is required"),
  }),
});

/* ================= PROFILE UPDATE ================= */

export const updateUserProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100).optional(),

    phone: phoneSchema.optional(),

    province: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    sector: z.string().trim().max(100).optional(),
    cell: z.string().trim().max(100).optional(),
    village: z.string().trim().max(100).optional(),

    profileImageUrl: cloudinaryImageSchema.optional(),
    profileImagePublicId: z.string().trim().optional(),
  }),
});

/* ================= STATUS ================= */

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),

  body: z.object({
    status: userStatusSchema,
  }),
});

/* ================= ROLE ================= */

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),

  body: z.object({
    role: roleSchema,
  }),
});

/* ================= FORGOT PASSWORD ================= */

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").trim().toLowerCase(),
  }),
});

/* ================= RESET PASSWORD ================= */

export const resetPasswordSchema = z
  .object({
    body: z.object({
      token: z.string().min(1, "Reset token is required"),

      password: passwordSchema,

      confirmPassword: z.string().min(1, "Confirm password is required"),
    }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    path: ["body", "confirmPassword"],
    message: "Passwords do not match",
  });

/* ================= VERIFY EMAIL ================= */

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

/* ================= PARAMS ================= */

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),
});

/* ================= SWAGGER ================= */

registry.register("RegisterUserInput", registerUserSchema);
registry.register("LoginUserInput", loginUserSchema);
registry.register("UpdateUserProfileInput", updateUserProfileSchema);
registry.register("UpdateUserStatusInput", updateUserStatusSchema);
registry.register("UpdateUserRoleInput", updateUserRoleSchema);
registry.register("ForgotPasswordInput", forgotPasswordSchema);
registry.register("ResetPasswordInput", resetPasswordSchema);
registry.register("VerifyEmailInput", verifyEmailSchema);

/* ================= TYPES ================= */

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"]
export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>["body"];
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>["body"];


export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];