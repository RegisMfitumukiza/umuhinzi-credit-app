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

export default router;