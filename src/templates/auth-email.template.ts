type TemplateOptions = {
  title: string;
  greeting?: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const baseEmailTemplate = ({
  title,
  greeting = "Hello,",
  message,
  actionText,
  actionUrl,
}: TemplateOptions) => {
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeMessage = escapeHtml(message);
  const safeActionText = actionText ? escapeHtml(actionText) : "";
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : "";

  return `
    <div style="font-family: Arial, sans-serif; background:#f9fafb; padding:24px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:28px; border-radius:16px; border:1px solid #e5e7eb;">
        
        <div style="text-align:center; margin-bottom:24px;">
          <div style="width:52px; height:52px; border-radius:50%; background:#dcfce7; margin:0 auto 14px; display:flex; align-items:center; justify-content:center;">
            <span style="font-size:26px;">🌱</span>
          </div>

          <h2 style="color:#111827; margin:0; font-size:24px; font-weight:700;">
            ${safeTitle}
          </h2>
        </div>

        <p style="color:#374151; font-size:15px; margin-bottom:12px;">
          ${safeGreeting}
        </p>

        <p style="line-height:1.7; color:#374151; font-size:15px; margin-bottom:22px;">
          ${safeMessage}
        </p>

        ${safeActionText && safeActionUrl
      ? `
              <p style="margin:28px 0; text-align:center;">
                <a href="${safeActionUrl}"
                   style="background:#22c55e; color:#ffffff; padding:14px 22px; text-decoration:none; border-radius:10px; display:inline-block; font-size:15px; font-weight:700;">
                  ${safeActionText}
                </a>
              </p>

              <p style="font-size:13px; color:#6b7280; line-height:1.5;">
                If the button does not work, copy and paste this link into your browser:
                <br />
                <span style="word-break:break-all; color:#374151;">${safeActionUrl}</span>
              </p>
            `
      : ""
    }

        <div style="border-top:1px dashed #e5e7eb; margin:26px 0;"></div>

        <p style="font-size:13px; color:#6b7280; line-height:1.5; margin-bottom:0;">
          If you did not request this action, you can safely ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

        <p style="font-size:12px; color:#9ca3af; line-height:1.5; text-align:center; margin:0;">
          Umuhinzi Credit<br />
          Smart Agricultural Credit & Financial Inclusion Platform
        </p>
      </div>
    </div>
  `;
};

export const passwordResetTemplate = (resetUrl: string) =>
  baseEmailTemplate({
    title: "Reset Your Password",
    message:
      "We received a request to reset your Umuhinzi Credit account password. Click the button below to create a new password. This link will expire in 15 minutes.",
    actionText: "Reset Password",
    actionUrl: resetUrl,
  });

export const emailVerificationTemplate = (verifyUrl: string) =>
  baseEmailTemplate({
    title: "Verify Your Email",
    message:
      "Welcome to Umuhinzi Credit. Please verify your email address to activate your account and continue using the platform.",
    actionText: "Verify Email",
    actionUrl: verifyUrl,
  });