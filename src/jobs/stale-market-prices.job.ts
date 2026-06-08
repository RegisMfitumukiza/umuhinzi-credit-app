import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";
import { createNotification } from "../utils/notification.helper.js";

const STALE_DAYS = 7;
const NOTIFICATION_TITLE = "Market Prices Need Updating";

/**
 * Runs daily at 08:00 AM.
 * Finds stale market prices (older than 7 days) and notifies all active
 * cooperative managers once per day so they remember to update prices.
 */
export const startStaleMarketPricesJob = (): void => {
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running stale market prices check job...");

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - STALE_DAYS);

      // Find distinct crop names with stale prices
      const stalePrices = await prisma.marketPrice.findMany({
        where: { recordedAt: { lt: sevenDaysAgo } },
        select: { cropName: true },
        distinct: ["cropName"],
        orderBy: { cropName: "asc" },
      });

      if (stalePrices.length === 0) {
        logger.info("Stale market prices job: all prices are up to date.");
        return;
      }

      const cropList = stalePrices.map((p) => p.cropName).join(", ");
      logger.info(`Stale market prices job: ${stalePrices.length} stale crop(s): ${cropList}`);

      // Find all active cooperative managers
      const managers = await prisma.user.findMany({
        where: { role: "COOPERATIVE_MANAGER", status: "ACTIVE" },
        select: { id: true },
      });

      if (managers.length === 0) {
        logger.info("Stale market prices job: no active cooperative managers found.");
        return;
      }

      // Avoid duplicate notifications — skip managers already notified today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const alreadyNotifiedIds = new Set(
        (
          await prisma.notification.findMany({
            where: {
              title: NOTIFICATION_TITLE,
              createdAt: { gte: todayStart },
              userId: { in: managers.map((m) => m.id) },
            },
            select: { userId: true },
          })
        ).map((n) => n.userId)
      );

      const toNotify = managers.filter((m) => !alreadyNotifiedIds.has(m.id));

      if (toNotify.length === 0) {
        logger.info("Stale market prices job: all managers already notified today.");
        return;
      }

      await Promise.all(
        toNotify.map((manager) =>
          createNotification({
            userId: manager.id,
            type: "SYSTEM",
            priority: "MEDIUM",
            title: NOTIFICATION_TITLE,
            message:
              stalePrices.length === 1
                ? `The price for ${cropList} hasn't been updated in over ${STALE_DAYS} days. Please update it to keep financial summaries accurate.`
                : `${stalePrices.length} crop prices (${cropList}) haven't been updated in over ${STALE_DAYS} days. Please review and update them.`,
            actionUrl: "/cooperative/market-prices",
          })
        )
      );

      logger.info(
        `Stale market prices job: notified ${toNotify.length} manager(s).`
      );
    } catch (error) {
      logger.error("Stale market prices job failed", { error });
    }
  });

  logger.info("Stale market prices job scheduled (daily at 08:00 AM)");
};
