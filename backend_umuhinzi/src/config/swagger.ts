import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { registry } from "../docs/registry.js";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import "../modules/institution/institution.docs.js";

const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Umuhinzi Credit API",
    version: "1.0.0",
    description: "REST API for Umuhinzi Credit App",
  },
  servers: [
    {
      url: process.env.BASE_URL || "http://localhost:3000",
      description: "API server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
});

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(document));
  app.get("/api-docs.json", (_req, res) => { res.json(document); });
  console.log("Swagger docs available at " + (process.env.BASE_URL || "http://localhost:3000") + "/api-docs");
}
