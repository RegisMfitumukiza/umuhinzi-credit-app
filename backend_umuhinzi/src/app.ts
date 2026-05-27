import express from "express";
import compression from "compression";
import cors from "cors";

import apiV1 from "./routes/v1/versioning.js";

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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

/* ================= ERROR HANDLING ================= */

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;