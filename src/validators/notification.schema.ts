import { z } from "zod";
import { registry } from "../docs/registry.js";

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= PARAMS ================= */

export const notificationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid notification ID") }),
});

/* ================= QUERY ================= */

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    isRead: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    type: z
      .enum([
        "LOAN_APPROVAL",
        "REPAYMENT_REMINDER",
        "CREDIT_SCORE_UPDATE",
        "MISSING_DATA_ALERT",
        "COOPERATIVE_ANNOUNCEMENT",
        "SYSTEM",
        "GENERAL",
      ])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
});

/* ================= BODY ================= */

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: uuidSchema("Invalid user ID"),
    type: z.enum([
      "LOAN_APPROVAL",
      "REPAYMENT_REMINDER",
      "CREDIT_SCORE_UPDATE",
      "MISSING_DATA_ALERT",
      "COOPERATIVE_ANNOUNCEMENT",
      "SYSTEM",
      "GENERAL",
    ]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    title: z.string().trim().min(2).max(120),
    message: z.string().trim().min(5).max(1000),
    actionUrl: z.string().trim().max(300).optional(),
  }),
});

/* ================= SWAGGER ================= */

registry.register("NotificationIdParam", notificationIdParamSchema);

/* ================= TYPES ================= */

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>["params"];
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>["query"];
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>["body"];
