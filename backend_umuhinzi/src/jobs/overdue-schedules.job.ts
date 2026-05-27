import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";
import {
  notifyRepaymentDueSoon,
  notifyRepaymentOverdue,
} from "../utils/notification.helper.js";

/**
 * Runs daily at 01:00 AM.
 * 1. Flips UPCOMING → DUE for schedules due within 3 days
 * 2. Flips DUE / PARTIALLY_PAID → OVERDUE for schedules past their due date
 * 3. Sends notifications to affected farmers
 */
export const startOverdueSchedulesJob = (): void => {
  cron.schedule("0 1 * * *", async () => {
    logger.info("Running overdue schedules job...");

    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      /* ── 1. UPCOMING → DUE (due within 3 days) ── */
      const dueSoon = await prisma.repaymentSchedule.findMany({
        where: {
          status: "UPCOMING",
          dueDate: { lte: threeDaysFromNow, gte: now },
        },
        select: {
          id: true,
          dueDate: true,
          expectedAmount: true,
          loanId: true,
          loan: { select: { farmerId: true, farmer: { select: { userId: true } } } },
        },
      });

      if (dueSoon.length > 0) {
        await prisma.repaymentSchedule.updateMany({
          where: { id: { in: dueSoon.map((s) => s.id) } },
          data: { status: "DUE" },
        });

        // Notify each farmer
        for (const schedule of dueSoon) {
          const userId = schedule.loan.farmer?.userId;
          if (userId) {
            await notifyRepaymentDueSoon(
              userId,
              schedule.loanId,
              schedule.dueDate,
              schedule.expectedAmount
            );
          }
        }

        logger.info(`Marked ${dueSoon.length} schedule(s) as DUE`);
      }

      /* ── 2. DUE / PARTIALLY_PAID → OVERDUE (past due date) ── */
      const nowOverdue = await prisma.repaymentSchedule.findMany({
        where: {
          status: { in: ["DUE", "PARTIALLY_PAID"] },
          dueDate: { lt: now },
        },
        select: {
          id: true,
          expectedAmount: true,
          loanId: true,
          loan: { select: { farmerId: true, farmer: { select: { userId: true } } } },
        },
      });

      if (nowOverdue.length > 0) {
        await prisma.repaymentSchedule.updateMany({
          where: { id: { in: nowOverdue.map((s) => s.id) } },
          data: { status: "OVERDUE" },
        });

        // Notify each farmer
        for (const schedule of nowOverdue) {
          const userId = schedule.loan.farmer?.userId;
          if (userId) {
            await notifyRepaymentOverdue(
              userId,
              schedule.loanId,
              schedule.expectedAmount
            );
          }
        }

        logger.info(`Marked ${nowOverdue.length} schedule(s) as OVERDUE`);
      }

      logger.info("Overdue schedules job completed.");
    } catch (error) {
      logger.error("Overdue schedules job failed", { error });
    }
  });

  logger.info("Overdue schedules job scheduled (daily at 01:00 AM)");
};
