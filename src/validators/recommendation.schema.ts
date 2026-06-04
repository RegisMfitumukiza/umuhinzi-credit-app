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

/* ================= SWAGGER ================= */

registry.register("CreateRecommendationInput", createRecommendationSchema);

/* ================= TYPES ================= */

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>["body"];
