import "dotenv/config";

import app from "./app.js";

import { prisma } from "./lib/prisma.js";
import { logger } from "./utils/logger.js";
import { startOverdueSchedulesJob } from "./jobs/overdue-schedules.job.js";
import { startAutoCreditScoreJob } from "./jobs/auto-credit-score.job.js";
import { seedAdmin } from "./scripts/seed-admin.js";

const PORT = Number(process.env.PORT) || 3000;

/* ================= START SERVER ================= */

async function startServer() {
  try {
    await prisma.$connect();

    logger.info("Database connected");

    await seedAdmin();

    app.listen(PORT, () => {
      logger.info(
        `Server running on http://localhost:${PORT}`
      );

      // Start background jobs
      startOverdueSchedulesJob();
      startAutoCreditScoreJob();
    });
  } catch (error) {
    logger.error("Failed to start server", { error });

    process.exit(1);
  }
}

startServer();