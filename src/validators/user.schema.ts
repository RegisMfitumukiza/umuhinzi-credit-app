import { z } from "zod";
import { registry } from "../docs/registry.js";

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

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must not exceed 100 characters")
  .refine(
    (value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value),
    { message: "Password must contain uppercase, lowercase and a number" }
  );

const phoneSchema = z.string().trim().refine(
  (value) => /^(\+?[0-9]{10,15})$/.test(value),
  { message: "Invalid phone number format" }
);

const cloudinaryImageSchema = z.url("Invalid image URL").refine(
  (url) => url.includes("cloudinary") || url.includes("res.cloudinary"),
  { message: "Image must be hosted on Cloudinary" }
);

export const registerUserSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.email("Invalid email").trim().toLowerCase(),
    phone: phoneSchema.optional(),
    password: passwordSchema,
    role: roleSchema
      .refine((role) => ["FARMER", "INSTITUTION", "COOPERATIVE_MANAGER"].includes(role), {
        message: "Only farmers, institutions, and cooperative managers can self-register",
      })
      .optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").trim().toLowerCase(),
  }),
});

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

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

export const resendVerificationEmailSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").trim().toLowerCase(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

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

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),
  body: z.object({
    status: userStatusSchema,
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),
  body: z.object({
    role: roleSchema,
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID" }),
  }),
});

registry.register("RegisterUserInput", registerUserSchema);
registry.register("LoginUserInput", loginUserSchema);
registry.register("ForgotPasswordInput", forgotPasswordSchema);
registry.register("ResetPasswordInput", resetPasswordSchema);
registry.register("VerifyEmailInput", verifyEmailSchema);
registry.register("ResendVerificationEmailInput", resendVerificationEmailSchema);
registry.register("RefreshTokenInput", refreshTokenSchema);
registry.register("UpdateUserProfileInput", updateUserProfileSchema);
registry.register("UpdateUserStatusInput", updateUserStatusSchema);
registry.register("UpdateUserRoleInput", updateUserRoleSchema);

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type ResendVerificationEmailInput = z.infer<typeof resendVerificationEmailSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>["body"];
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>["body"];
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>["body"];
