import { resend, EMAIL_FROM, isEmailEnabled, gmailTransporter } from "../config/email.js";
import { logger } from "../utils/logger.js";
import { APIError } from "../utils/ApiError.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  if (!isEmailEnabled) {
    logger.warn("Email sending skipped: no email credentials configured", { to, subject });
    return null;
  }

  // Prefer Gmail SMTP — can send to any address
  if (gmailTransporter) {
    try {
      const fromAddress = process.env.EMAIL_USER
        ? `Umuhinzi Credit <${process.env.EMAIL_USER}>`
        : EMAIL_FROM;

      const result = await gmailTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });

      logger.info("Email sent via Gmail SMTP", { to, subject, messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error("Gmail SMTP failed, attempting Resend fallback", { to, subject, error });
      // fall through to Resend if gmail fails
    }
  }

  // Resend fallback (only delivers to resend-registered email in free tier)
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info("Email sent via Resend", { to, subject });
      return result;
    } catch (error) {
      logger.error("Failed to send email via Resend", { to, subject, error });
      throw new APIError("Failed to send email", 500);
    }
  }

  throw new APIError("No email provider configured", 500);
};
