import { z } from "zod";
import { registry } from "../docs/registry.js";

const uuidSchema = (message: string) => z.uuid({ message });

/* ================= PARAMS ================= */

export const notificationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema("Invalid notification ID") }),
});

/* ================= SWAGGER ================= */

registry.register("NotificationIdParam", notificationIdParamSchema);

/* ================= TYPES ================= */

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>["params"];
