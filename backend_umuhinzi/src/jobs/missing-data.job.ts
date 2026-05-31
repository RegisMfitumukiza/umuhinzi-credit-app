import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";
import { notifyMissingData } from "../utils/notification.helper.js";

/**
 * Runs daily at 06:00 AM.
 * Finds farmers with incomplete profiles and sends a notification listing
 * what data is missing (farms, crops, yield records, credit score).
 */
export const startMissingDataJob = (): void => {
  cron.schedule("0 6 * * *", async () => {
    logger.info("Running missing data alert job...");

    try {
      const farmers = await prisma.farmer.findMany({
        select: { id: true, user: { select: { id: true } } },
      });

      let notified = 0;

      for (const farmer of farmers) {
        const userId = farmer.user?.id;
        if (!userId) continue;

        const [creditScoreCount, farmCount, cropCount, yieldCount] = await Promise.all([
          prisma.creditScore.count({ where: { farmerId: farmer.id } }),
          prisma.farm.count({ where: { farmerId: farmer.id } }),
          prisma.crop.count({ where: { farm: { farmerId: farmer.id } } }),
          prisma.yieldRecord.count({ where: { crop: { farm: { farmerId: farmer.id } } } }),
        ]);

        const missingFields: string[] = [];
        if (farmCount === 0) missingFields.push("farm registration");
        if (cropCount === 0) missingFields.push("crop records");
        if (yieldCount === 0) missingFields.push("yield records");
        if (creditScoreCount === 0) missingFields.push("credit score");

        if (missingFields.length > 0) {
          await notifyMissingData(userId, missingFields);
          notified++;
        }
      }

      logger.info(`Missing data alert job completed. Notified ${notified} farmer(s).`);
    } catch (error) {
      logger.error("Missing data alert job failed", { error });
    }
  });

  logger.info("Missing data alert job scheduled (daily at 06:00 AM)");
};
