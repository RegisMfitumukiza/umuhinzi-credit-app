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

  // In development, redirect ALL emails to DEV_EMAIL_REDIRECT.
  // This is needed because onboarding@resend.dev only delivers to
  // the email address you used to sign up at resend.com.
  const isDev = process.env.NODE_ENV !== "production";
  const devRedirect = process.env.DEV_EMAIL_REDIRECT;

  const recipient = isDev && devRedirect ? devRedirect : to;

  // In dev, add a note to the subject so you know who it was originally for
  const finalSubject =
    isDev && devRedirect && devRedirect !== to
      ? `[DEV → ${to}] ${subject}`
      : subject;

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipient,
      subject: finalSubject,
      html,
    });

    logger.info("Email sent", {
      originalTo: to,
      deliveredTo: recipient,
      subject: finalSubject,
    });

    return result;
  } catch (error) {
    logger.error("Failed to send email", { to: recipient, subject: finalSubject, error });
    throw new APIError("Failed to send email", 500);
  }
};
