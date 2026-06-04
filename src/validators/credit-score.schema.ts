import { z } from "zod";
import { registry } from "../docs/registry.js";

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= GENERATE CREDIT SCORE ================= */

export const generateCreditScoreSchema = z.object({
  body: z.object({
    farmerId: uuidSchema("Invalid farmer ID").optional(),
  }),
});

/* ================= PARAMS ================= */

export const creditScoreIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid credit score ID"),
  }),
});

export const farmerIdParamSchema = z.object({
  params: z.object({
    farmerId: uuidSchema("Invalid farmer ID"),
  }),
});

/* ================= SWAGGER ================= */

registry.register("GenerateCreditScoreInput", generateCreditScoreSchema);

/* ================= TYPES ================= */

export type GenerateCreditScoreInput = z.infer<
  typeof generateCreditScoreSchema
>["body"];
