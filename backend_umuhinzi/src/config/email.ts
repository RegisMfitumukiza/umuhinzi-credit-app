import { Resend } from "resend";
import nodemailer from "nodemailer";

const resendApiKey = process.env.RESEND_API_KEY;

export const isEmailEnabled = Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_PASS
) || Boolean(resendApiKey);

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Umuhinzi Credit <onboarding@resend.dev>";

// Gmail SMTP transporter — used when EMAIL_USER and EMAIL_PASS are set
export const gmailTransporter =
  process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.EMAIL_ALLOW_SELF_SIGNED !== "true",
        },
      })
    : null;