import { prisma } from "../lib/prisma.js";
import { logger } from "./logger.js";
import type { NotificationType, NotificationPriority } from "../generated/prisma/client.js";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
};

/**
 * Creates a notification for a user. Silently catches errors so it never
 * disrupts the main business flow that calls it.
 */
export const createNotification = async (
  input: CreateNotificationInput
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        priority: input.priority ?? "MEDIUM",
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
      },
    });
  } catch (error) {
    logger.error("Failed to create notification", { error, input });
  }
};

/* ─── Pre-built notification factories ─── */

export const notifyLoanApplicationSubmitted = (userId: string, applicationId: string) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "MEDIUM",
    title: "Loan Application Submitted",
    message: "Your loan application has been submitted and is pending review.",
    actionUrl: `/loan-applications/${applicationId}`,
  });

export const notifyLoanApplicationUnderReview = (userId: string, applicationId: string) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "MEDIUM",
    title: "Loan Application Under Review",
    message: "Your loan application is now under review by our team.",
    actionUrl: `/loan-applications/${applicationId}`,
  });

export const notifyLoanApplicationApproved = (
  userId: string,
  applicationId: string,
  approvedAmount: number
) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "HIGH",
    title: "Loan Application Approved",
    message: `Congratulations! Your loan application has been approved for ${approvedAmount.toLocaleString()} RWF.`,
    actionUrl: `/loan-applications/${applicationId}`,
  });

export const notifyLoanApplicationRejected = (
  userId: string,
  applicationId: string,
  reason?: string
) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "HIGH",
    title: "Loan Application Rejected",
    message: reason
      ? `Your loan application was rejected. Reason: ${reason}`
      : "Your loan application was not approved at this time.",
    actionUrl: `/loan-applications/${applicationId}`,
  });

export const notifyLoanApplicationCancelled = (userId: string, applicationId: string) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "LOW",
    title: "Loan Application Cancelled",
    message: "Your loan application has been cancelled.",
    actionUrl: `/loan-applications/${applicationId}`,
  });

export const notifyLoanDisbursed = (
  userId: string,
  loanId: string,
  disbursedAmount: number
) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "HIGH",
    title: "Loan Disbursed",
    message: `Your loan of ${disbursedAmount.toLocaleString()} RWF has been disbursed. Repayment schedules have been generated.`,
    actionUrl: `/loans/${loanId}`,
  });

export const notifyRepaymentRecorded = (
  userId: string,
  loanId: string,
  amountPaid: number
) =>
  createNotification({
    userId,
    type: "REPAYMENT_REMINDER",
    priority: "LOW",
    title: "Repayment Recorded",
    message: `A repayment of ${amountPaid.toLocaleString()} RWF has been recorded on your loan.`,
    actionUrl: `/loans/${loanId}`,
  });

export const notifyLoanCompleted = (userId: string, loanId: string) =>
  createNotification({
    userId,
    type: "LOAN_APPROVAL",
    priority: "HIGH",
    title: "Loan Fully Repaid",
    message: "Congratulations! You have fully repaid your loan. Your credit score will be updated.",
    actionUrl: `/loans/${loanId}`,
  });

export const notifyRepaymentDueSoon = (
  userId: string,
  loanId: string,
  dueDate: Date,
  expectedAmount: number
) =>
  createNotification({
    userId,
    type: "REPAYMENT_REMINDER",
    priority: "HIGH",
    title: "Repayment Due Soon",
    message: `A repayment of ${expectedAmount.toLocaleString()} RWF is due on ${dueDate.toLocaleDateString()}.`,
    actionUrl: `/loans/${loanId}`,
  });

export const notifyRepaymentOverdue = (
  userId: string,
  loanId: string,
  expectedAmount: number
) =>
  createNotification({
    userId,
    type: "REPAYMENT_REMINDER",
    priority: "URGENT",
    title: "Repayment Overdue",
    message: `A repayment of ${expectedAmount.toLocaleString()} RWF is overdue. Please make payment immediately to avoid penalties.`,
    actionUrl: `/loans/${loanId}`,
  });

export const notifyCreditScoreUpdated = (
  userId: string,
  score: number,
  riskLevel: string
) =>
  createNotification({
    userId,
    type: "CREDIT_SCORE_UPDATE",
    priority: "MEDIUM",
    title: "Credit Score Updated",
    message: `Your credit score has been updated to ${score}/100 (Risk: ${riskLevel}).`,
    actionUrl: `/credit-scores`,
  });

export const notifyMissingData = (userId: string, missingFields: string[]) =>
  createNotification({
    userId,
    type: "MISSING_DATA_ALERT",
    priority: "MEDIUM",
    title: "Complete Your Profile",
    message: `Your profile is missing important data: ${missingFields.join(", ")}. Complete it to improve your credit score.`,
    actionUrl: `/profile`,
  });
