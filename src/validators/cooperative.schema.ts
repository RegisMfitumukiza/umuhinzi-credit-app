import { z } from "zod";
import { registry } from "../docs/registry.js";

/* ================= ENUMS ================= */

export const cooperativeStatusSchema = z.enum([
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "DEACTIVATED",
]);

export const cooperativeMemberStatusSchema = z.enum([
    "PENDING",
    "ACTIVE",
    "REMOVED",
    "LEFT",
]);

/* ================= HELPERS ================= */

const phoneSchema = z
    .string()
    .trim()
    .refine((value) => /^(\+?[0-9]{10,15})$/.test(value), {
        message: "Invalid phone number format",
    });

const emailSchema = z.email("Invalid email").trim().toLowerCase();

const uuidSchema = (message: string) =>
    z.uuid({
        message,
    });

/* ================= CREATE COOPERATIVE ================= */

export const createCooperativeSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Cooperative name must be at least 2 characters")
            .max(150, "Cooperative name must not exceed 150 characters"),

        registrationNumber: z
            .string()
            .trim()
            .min(3, "Registration number must be at least 3 characters")
            .max(100, "Registration number must not exceed 100 characters")
            .optional(),

        description: z.string().trim().max(500).optional(),

        email: emailSchema.optional(),
        phone: phoneSchema.optional(),
        address: z.string().trim().max(255).optional(),

        province: z.string().trim().max(100).optional(),
        district: z.string().trim().max(100).optional(),
        sector: z.string().trim().max(100).optional(),
        cell: z.string().trim().max(100).optional(),
        village: z.string().trim().max(100).optional(),
    }),
});

/* ================= UPDATE COOPERATIVE ================= */

export const updateCooperativeSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative ID"),
    }),

    body: z.object({
        name: z.string().trim().min(2).max(150).optional(),

        registrationNumber: z.string().trim().min(3).max(100).optional(),

        description: z.string().trim().max(500).optional(),

        email: emailSchema.optional(),
        phone: phoneSchema.optional(),
        address: z.string().trim().max(255).optional(),

        province: z.string().trim().max(100).optional(),
        district: z.string().trim().max(100).optional(),
        sector: z.string().trim().max(100).optional(),
        cell: z.string().trim().max(100).optional(),
        village: z.string().trim().max(100).optional(),
    }),
});

/* ================= COOPERATIVE STATUS ================= */

export const updateCooperativeStatusSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative ID"),
    }),

    body: z.object({
        status: cooperativeStatusSchema,
    }),
});

/* ================= COOPERATIVE MANAGER ================= */

export const createCooperativeManagerSchema = z.object({
    body: z.object({
        userId: uuidSchema("Invalid user ID"),
        cooperativeId: uuidSchema("Invalid cooperative ID"),

        position: z.string().trim().min(2).max(100).optional(),
    }),
});

export const updateCooperativeManagerSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative manager ID"),
    }),

    body: z.object({
        cooperativeId: uuidSchema("Invalid cooperative ID").optional(),

        position: z.string().trim().min(2).max(100).optional(),
    }),
});

/* ================= COOPERATIVE MEMBER ================= */

export const addCooperativeMemberSchema = z.object({
    body: z.object({
        cooperativeId: uuidSchema("Invalid cooperative ID"),
        farmerId: uuidSchema("Invalid farmer ID").optional(),
        status: cooperativeMemberStatusSchema.optional(),
        joinedAt: z.coerce.date().optional(),
    }),
});

export const updateCooperativeMemberSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative member ID"),
    }),

    body: z.object({
        status: cooperativeMemberStatusSchema.optional(),
        joinedAt: z.coerce.date().optional(),
        leftAt: z.coerce.date().optional(),
    }),
});

export const removeCooperativeMemberSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative member ID"),
    }),
});

/* ================= PARAMS ================= */

export const cooperativeIdParamSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative ID"),
    }),
});

export const cooperativeManagerIdParamSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative manager ID"),
    }),
});

export const cooperativeMemberIdParamSchema = z.object({
    params: z.object({
        id: uuidSchema("Invalid cooperative member ID"),
    }),
});

/* ================= SWAGGER ================= */

registry.register("CreateCooperativeInput", createCooperativeSchema);
registry.register("UpdateCooperativeInput", updateCooperativeSchema);
registry.register("UpdateCooperativeStatusInput", updateCooperativeStatusSchema);
registry.register("CreateCooperativeManagerInput", createCooperativeManagerSchema);
registry.register("UpdateCooperativeManagerInput", updateCooperativeManagerSchema);
registry.register("AddCooperativeMemberInput", addCooperativeMemberSchema);
registry.register("UpdateCooperativeMemberInput", updateCooperativeMemberSchema);

/* ================= TYPES ================= */

export type CreateCooperativeInput = z.infer<typeof createCooperativeSchema>["body"];

export type UpdateCooperativeInput = z.infer<typeof updateCooperativeSchema>["body"];

export type UpdateCooperativeStatusInput = z.infer<typeof updateCooperativeStatusSchema>["body"];

export type CreateCooperativeManagerInput = z.infer<typeof createCooperativeManagerSchema>["body"];

export type UpdateCooperativeManagerInput = z.infer<typeof updateCooperativeManagerSchema>["body"];

export type AddCooperativeMemberInput = z.infer<typeof addCooperativeMemberSchema>["body"];

export type UpdateCooperativeMemberInput = z.infer<typeof updateCooperativeMemberSchema>["body"];

/*for now let us stop here, i will tell you when to continue. 
so i have services and controller i want to start implementing the codes. 


let me show an example of how i want it to be*/ 

