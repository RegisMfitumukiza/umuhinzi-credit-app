import "dotenv/config";

import app from "./app.js";

import { prisma } from "./lib/prisma.js";
import { logger } from "./utils/logger.js";
import { startOverdueSchedulesJob } from "./jobs/overdue-schedules.job.js";

const PORT = Number(process.env.PORT) || 3000;

/* ================= HEALTH CHECK ================= */

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

/* ================= START SERVER ================= */

async function startServer() {
  try {
    await prisma.$connect();

    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(
        `Server running on http://localhost:${PORT}`
      );

      // Start background jobs
      startOverdueSchedulesJob();
    });
  } catch (error) {
    logger.error("Failed to start server", { error });

    process.exit(1);
  }
}

startServer();