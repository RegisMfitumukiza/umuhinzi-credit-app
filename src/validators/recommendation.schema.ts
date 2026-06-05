import { z } from "zod";
import { registry } from "../docs/registry.js";

const uuidSchema = (message: string) => z.uuid({ message });

export const recommendationTypeSchema = z.enum([
  "LOAN_AMOUNT",
  "FINANCIAL_IMPROVEMENT",
  "REPAYMENT_STRATEGY",
  "PRODUCTIVITY",
  "RISK_REDUCTION",
  "DATA_COMPLETENESS",
  "GENERAL_ADVISORY",
]);

export const recommendationPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

/* ================= CREATE ================= */

export const createRecommendationSchema = z.object({
  body: z.object({
    farmerId: uuidSchema("Invalid farmer ID"),
    type: recommendationTypeSchema,
    priority: recommendationPrioritySchema.optional(),
    title: z.string().trim().min(2).max(200),
    message: z.string().trim().min(2).max(1000),
    actionLabel: z.string().trim().max(100).optional(),
    actionUrl: z.string().trim().max(500).optional(),
  }),
});

/* ================= PARAMS ================= */

export const recommendationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid recommendation ID") }),
});

/* ================= UPDATE ================= */

export const updateRecommendationSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid recommendation ID") }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      message: z.string().trim().min(2).max(1000).optional(),
      type: recommendationTypeSchema.optional(),
      priority: recommendationPrioritySchema.optional(),
      status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
      actionLabel: z.string().trim().max(100).optional(),
      actionUrl: z.string().trim().max(500).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" }),
});

/* ================= QUERY ================= */

export const getRecommendationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(["ACTIVE", "READ", "ARCHIVED", "DISMISSED"]).optional(),
    type: recommendationTypeSchema.optional(),
    priority: recommendationPrioritySchema.optional(),
  }),
});

/* ================= SWAGGER ================= */

registry.register("CreateRecommendationInput", createRecommendationSchema);

/* ================= TYPES ================= */

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>["body"];
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>["body"];
export type GetRecommendationsQuery = z.infer<typeof getRecommendationsQuerySchema>["query"];
