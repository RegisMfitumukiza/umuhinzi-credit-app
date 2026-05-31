import { resend, EMAIL_FROM, isEmailEnabled } from "../config/email.js";
import { logger } from "../utils/logger.js";
import { APIError } from "../utils/ApiError.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  if (!isEmailEnabled || !resend) {
    logger.warn("Email sending skipped: RESEND_API_KEY missing", { to, subject });
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info("Email sent", {
      to,
      subject,
    });

    return result;
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error
    });
    throw error;
  }
};
