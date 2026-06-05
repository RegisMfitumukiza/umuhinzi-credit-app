import express from "express";
import compression from "compression";
import cors from "cors";

import apiV1 from "./routes/v1/versioning.js";
import { prisma } from "./lib/prisma.js";

import { globalErrorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { apiLimiter, perUserLimiter } from "./middlewares/rateLimiting.js";
import { setupSwagger } from "./config/swagger.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

/* ================= ROOT ================= */

app.get("/", (_req, res) => {
  res.send("Umuhinzi Credit API is running...");
});

/* ================= DOCS ================= */

setupSwagger(app);

/* ================= ROUTES ================= */

app.use("/api/v1", apiLimiter, perUserLimiter, apiV1);

/* ================= HEALTH ================= */

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date(),
      service: "umuhinzi-credit-api",
      environment: process.env.NODE_ENV,
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/* ================= ERROR HANDLING ================= */

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
