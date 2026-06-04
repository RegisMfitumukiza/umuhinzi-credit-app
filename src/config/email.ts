import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const isEmailEnabled = Boolean(resendApiKey);

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM || "Umuhinzi Credit <onboarding@resend.dev>";