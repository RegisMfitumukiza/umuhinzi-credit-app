import { prisma } from "../lib/prisma.js";
import { logger } from "./logger.js";
import { generateCreditScoreService } from "../services/credit-score.service.js";

/**
 * Silently triggers a credit score recalculation for a farmer.
 * Called automatically when yield, repayment, or financial data changes.
 * Never throws — errors are logged and swallowed.
 */
export const triggerCreditScoreRecalculation = async (
  farmerId: string
): Promise<void> => {
  try {
    // Only recalculate if farmer has at least some data to score
    const [farmsCount, yieldCount] = await Promise.all([
      prisma.farm.count({ where: { farmerId } }),
      prisma.yieldRecord.count({ where: { crop: { farm: { farmerId } } } }),
    ]);

    if (farmsCount === 0 && yieldCount === 0) {
      // Not enough data yet — skip silently
      return;
    }

    // Get the farmer's userId for the service call
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      select: { userId: true },
    });

    if (!farmer) return;

    await generateCreditScoreService(
      farmer.userId,
      farmerId,
      true, // treat as admin-triggered (no auth check needed)
      {}
    );

    logger.info(`Auto credit score recalculated for farmer ${farmerId}`);
  } catch (error) {
    logger.error("Auto credit score recalculation failed", { error, farmerId });
  }
};
