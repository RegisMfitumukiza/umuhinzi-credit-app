import { z } from "zod";
import { registry } from "../docs/registry.js";

export const auditActionSchema = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET",
  "STATUS_CHANGE",
  "ROLE_CHANGE",
  "FILE_UPLOAD",
  "FILE_DELETE",
  "SYSTEM",
]);

export const auditResourceSchema = z.enum([
  "USER",
  "FARMER",
  "INSTITUTION",
  "COOPERATIVE",
  "FARM",
  "CROP",
  "LOAN",
  "REPAYMENT",
  "CREDIT_SCORE",
  "NOTIFICATION",
  "AUTH",
  "SYSTEM",
]);

const uuidSchema = (message: string) => z.uuid({ message });

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ])
);

export const createAuditLogSchema = z.object({
  body: z.object({
    actorId: uuidSchema("Invalid actor ID").optional(),
    action: auditActionSchema,
    resource: auditResourceSchema,
    resourceId: z.string().trim().optional(),
    description: z.string().trim().max(500).optional(),
    metadata: jsonSchema.optional(),
    ipAddress: z.string().trim().optional(),
    userAgent: z.string().trim().optional(),
  }),
});

export const auditLogIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema("Invalid audit log ID"),
  }),
});

registry.register("CreateAuditLogInput", createAuditLogSchema);

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>["body"];