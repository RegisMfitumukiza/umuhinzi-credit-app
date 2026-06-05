import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";
import { generateCreditScoreService } from "../services/credit-score.service.js";

const BATCH_SIZE = 10;

/**
 * Runs daily at 02:00 AM.
 * Finds every farmer whose latest credit score is older than 30 days
 * (or who has never had one) and auto-generates a fresh score for them.
 * Processed in batches of 10 so the DB is never overwhelmed.
 */
export const startAutoCreditScoreJob = (): void => {
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running auto credit score job...");

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Farmers with no credit score OR whose most recent score predates 30 days ago
      const farmers = await prisma.farmer.findMany({
        where: {
          creditScores: {
            none: { generatedAt: { gte: thirtyDaysAgo } },
          },
        },
        select: { id: true, userId: true },
      });

      if (farmers.length === 0) {
        logger.info("Auto credit score job: all farmers are up to date.");
        return;
      }

      logger.info(`Auto credit score job: refreshing scores for ${farmers.length} farmer(s).`);

      let success = 0;
      let failed = 0;

      for (let i = 0; i < farmers.length; i += BATCH_SIZE) {
        const batch = farmers.slice(i, i + BATCH_SIZE);

        await Promise.allSettled(
          batch.map(async (farmer) => {
            try {
              await generateCreditScoreService(
                farmer.userId,
                farmer.id,
                true,
                {}
              );
              success++;
            } catch (error) {
              failed++;
              logger.error("Auto credit score: failed for farmer", { farmerId: farmer.id, error });
            }
          })
        );
      }

      logger.info(`Auto credit score job completed. Success: ${success}, Failed: ${failed}.`);
    } catch (error) {
      logger.error("Auto credit score job failed", { error });
    }
  });

  logger.info("Auto credit score job scheduled (daily at 02:00 AM)");
};
