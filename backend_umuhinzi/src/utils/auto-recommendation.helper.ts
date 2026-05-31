import { prisma } from "../lib/prisma.js";
import type { RiskLevel } from "../generated/prisma/client.js";

type FactorScores = {
  yieldConsistencyScore: number;
  farmingHistoryScore: number;
  incomeStabilityScore: number;
  repaymentBehaviorScore: number;
  productivityScore: number;
  dataCompletenessScore: number;
};

type RecommendationInput = {
  type: "LOAN_AMOUNT" | "FINANCIAL_IMPROVEMENT" | "REPAYMENT_STRATEGY" | "PRODUCTIVITY" | "RISK_REDUCTION" | "DATA_COMPLETENESS" | "GENERAL_ADVISORY";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
};

export const generateAutoRecommendations = async (
  farmerId: string,
  score: number,
  riskLevel: RiskLevel,
  factorScores: FactorScores
): Promise<void> => {
  const recommendations: RecommendationInput[] = [];

  if (factorScores.dataCompletenessScore < 60) {
    recommendations.push({
      type: "DATA_COMPLETENESS",
      priority: factorScores.dataCompletenessScore < 30 ? "HIGH" : "MEDIUM",
      title: "Complete your farmer profile",
      message: `Your profile is ${factorScores.dataCompletenessScore}% complete. Adding missing details (date of birth, farming experience, crops, farms) will improve your credit score.`,
    });
  }

  if (factorScores.yieldConsistencyScore < 40) {
    recommendations.push({
      type: "PRODUCTIVITY",
      priority: "HIGH",
      title: "Record your expected and actual yields",
      message:
        "Lenders assess yield consistency to evaluate loan eligibility. Start recording your expected and actual yields each season to strengthen your credit profile.",
    });
  }

  if (factorScores.incomeStabilityScore < 40) {
    recommendations.push({
      type: "FINANCIAL_IMPROVEMENT",
      priority: factorScores.incomeStabilityScore < 20 ? "CRITICAL" : "HIGH",
      title: "Improve your income stability",
      message:
        "Your financial summaries show limited positive cash flow. Track income and expenses through the platform to demonstrate financial stability to lenders.",
    });
  }

  if (factorScores.repaymentBehaviorScore < 50) {
    recommendations.push({
      type: "REPAYMENT_STRATEGY",
      priority: "HIGH",
      title: "Address overdue repayments",
      message:
        "Overdue loan repayments are reducing your credit score. Contact your lender to discuss a repayment plan and avoid future late payments.",
    });
  }

  if (factorScores.productivityScore < 40) {
    recommendations.push({
      type: "PRODUCTIVITY",
      priority: "MEDIUM",
      title: "Log seasonal productivity records",
      message:
        "Productivity records help lenders understand your farming performance. Enter your expected and actual yields each season to build a strong track record.",
    });
  }

  if (riskLevel === "VERY_HIGH" || riskLevel === "HIGH") {
    recommendations.push({
      type: "RISK_REDUCTION",
      priority: riskLevel === "VERY_HIGH" ? "CRITICAL" : "HIGH",
      title: "Your credit risk is currently high",
      message: `Your credit score is ${score}/100 (${riskLevel.toLowerCase().replace("_", " ")} risk). Focus on completing your profile, recording yields, and maintaining positive cash flow to become eligible for larger loan products.`,
    });
  }

  if (riskLevel === "LOW") {
    recommendations.push({
      type: "LOAN_AMOUNT",
      priority: "LOW",
      title: "You qualify for premium loan products",
      message: `With a credit score of ${score}/100, you are eligible for standard and premium loan products. Consider applying for a loan to expand your farming operations.`,
    });
  } else if (riskLevel === "MEDIUM") {
    recommendations.push({
      type: "LOAN_AMOUNT",
      priority: "MEDIUM",
      title: "You qualify for basic loan products",
      message: `Your credit score of ${score}/100 makes you eligible for basic loan products. Improving key factors like yield consistency and income stability will unlock better rates.`,
    });
  }

  if (recommendations.length === 0) return;

  await prisma.recommendation.createMany({
    data: recommendations.map((r) => ({ ...r, farmerId, status: "ACTIVE" as const })),
  });
};
