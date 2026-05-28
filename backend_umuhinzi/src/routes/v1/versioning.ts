import { Router } from "express";

import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import farmerRoutes from "./farmer.routes.js";
import farmRoutes from "./farm.routes.js";
import { cropRouter, seasonRouter } from "./crop.routes.js";
import livestockRoutes from "./livestock.routes.js";
import {
  yieldRouter,
  inputCostRouter,
  productivityRouter,
} from "./productivity.routes.js";
import {
  expenseRouter,
  financialSummaryRouter,
  marketPriceRouter,
} from "./finance.routes.js";
import { creditScoreRouter } from "./credit-score.routes.js";
import {
  loanApplicationRouter,
  loanRouter,
  repaymentRouter,
  repaymentScheduleRouter,
} from "./loan.routes.js";
import { institutionRouter } from "./institution.routes.js";
import { cooperativeRouter, cooperativeMemberRouter } from "./cooperative.routes.js";
import { recommendationRouter } from "./recommendation.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { auditLogRouter } from "./audit-log.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { exportRouter } from "./export.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/farmers", farmerRoutes);
router.use("/farms", farmRoutes);
router.use("/crops", cropRouter);
router.use("/seasons", seasonRouter);
router.use("/livestock", livestockRoutes);
router.use("/yields", yieldRouter);
router.use("/input-costs", inputCostRouter);
router.use("/productivity", productivityRouter);
router.use("/expenses", expenseRouter);
router.use("/financial-summaries", financialSummaryRouter);
router.use("/market-prices", marketPriceRouter);
router.use("/credit-scores", creditScoreRouter);
router.use("/loan-applications", loanApplicationRouter);
router.use("/loans", loanRouter);
router.use("/repayments", repaymentRouter);
router.use("/repayment-schedules", repaymentScheduleRouter);
router.use("/institutions", institutionRouter);
router.use("/cooperatives", cooperativeRouter);
router.use("/cooperative-members", cooperativeMemberRouter);
router.use("/recommendations", recommendationRouter);
router.use("/notifications", notificationRouter);
router.use("/analytics", analyticsRouter);
router.use("/audit-logs", auditLogRouter);
router.use("/uploads", uploadRouter);
router.use("/exports", exportRouter);

export default router;
