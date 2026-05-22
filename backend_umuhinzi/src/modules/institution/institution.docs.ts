import { registry } from "../../docs/registry.js";
import { z } from "zod";
import { CreateInstitutionSchema, UpdateInstitutionSchema, UpdateInstitutionStatusSchema } from "./institution.schema.js";

const bearerAuth = { bearerAuth: [] };

const InstitutionResponse = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  province: z.string().nullable(),
  district: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("InstitutionResponse");

registry.registerPath({
  method: "post",
  path: "/api/v1/institutions",
  summary: "Create institution profile",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: { body: { content: { "application/json": { schema: CreateInstitutionSchema } } } },
  responses: { 201: { description: "Institution created", content: { "application/json": { schema: z.object({ success: z.boolean(), data: InstitutionResponse }) } } } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/institutions",
  summary: "Get all institutions (Admin)",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: {
    query: z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      district: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: { 200: { description: "List of institutions", content: { "application/json": { schema: z.object({ success: z.boolean(), data: z.array(InstitutionResponse) }) } } } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/institutions/me",
  summary: "Get my institution profile",
  tags: ["Institutions"],
  security: [bearerAuth],
  responses: { 200: { description: "My institution", content: { "application/json": { schema: z.object({ success: z.boolean(), data: InstitutionResponse }) } } } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/institutions/{id}",
  summary: "Get institution by ID (Admin)",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Institution found", content: { "application/json": { schema: z.object({ success: z.boolean(), data: InstitutionResponse }) } } } },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/institutions/me/{id}",
  summary: "Update my institution",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: UpdateInstitutionSchema } } },
  },
  responses: { 200: { description: "Institution updated", content: { "application/json": { schema: z.object({ success: z.boolean(), data: InstitutionResponse }) } } } },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/institutions/{id}/status",
  summary: "Update institution status (Admin)",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: UpdateInstitutionStatusSchema } } },
  },
  responses: { 200: { description: "Status updated", content: { "application/json": { schema: z.object({ success: z.boolean(), data: InstitutionResponse }) } } } },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/institutions/{id}",
  summary: "Delete institution (Admin)",
  tags: ["Institutions"],
  security: [bearerAuth],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Institution deleted", content: { "application/json": { schema: z.object({ success: z.boolean(), message: z.string() }) } } } },
});
