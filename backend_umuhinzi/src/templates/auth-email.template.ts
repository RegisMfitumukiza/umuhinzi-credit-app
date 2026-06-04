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

export const provisionedAccountTemplate = ({
  fullName,
  email,
  temporaryPassword,
  role,
  loginUrl,
}: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  role: string;
  loginUrl: string;
}) => {
  const roleLabel = role === "INSTITUTION" ? "Financial Institution" : "Government Partner";
  const dashboardName = role === "INSTITUTION" ? "Institution Dashboard" : "Government Dashboard";

  // Build credentials box directly in HTML — do NOT use escapeHtml on the full block
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeRoleLabel = escapeHtml(roleLabel);
  const safeDashboard = escapeHtml(dashboardName);

  return `
    <div style="font-family: Arial, sans-serif; background:#f9fafb; padding:24px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:28px; border-radius:16px; border:1px solid #e5e7eb;">

        <div style="text-align:center; margin-bottom:24px;">
          <div style="width:52px; height:52px; border-radius:50%; background:#dcfce7; margin:0 auto 14px;">
            <span style="font-size:26px; line-height:52px;">🌱</span>
          </div>
          <h2 style="color:#111827; margin:0; font-size:22px; font-weight:700;">
            Your ${safeRoleLabel} Account is Ready
          </h2>
        </div>

        <p style="color:#374151; font-size:15px; margin-bottom:16px;">Hello <strong>${safeFullName}</strong>,</p>

        <p style="color:#374151; font-size:15px; line-height:1.7; margin-bottom:20px;">
          Your <strong>${safeRoleLabel}</strong> account on <strong>Umuhinzi Credit</strong> has been created
          by the platform administrator. Use the credentials below to log in and access your ${safeDashboard}.
        </p>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px; margin-bottom:24px;">
          <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#16a34a;">Your Login Credentials</p>
          <table style="width:100%; border-collapse:collapse; margin-top:12px;">
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:14px; width:140px;">Login Email</td>
              <td style="padding:8px 0; font-size:14px; font-weight:600; color:#111827;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:14px;">Temporary Password</td>
              <td style="padding:8px 0; font-size:14px; font-weight:600; color:#111827; font-family:monospace; background:#fff; border-radius:6px; padding-left:8px;">${safePassword}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:14px;">Your Role</td>
              <td style="padding:8px 0; font-size:14px; font-weight:600; color:#111827;">${safeRoleLabel}</td>
            </tr>
          </table>
        </div>

        <p style="margin:28px 0; text-align:center;">
          <a href="${safeLoginUrl}"
             style="background:#22c55e; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:10px; display:inline-block; font-size:15px; font-weight:700;">
            Go to ${safeDashboard} →
          </a>
        </p>

        <p style="font-size:13px; color:#6b7280; line-height:1.5; text-align:center;">
          Or copy this link: <span style="word-break:break-all; color:#374151;">${safeLoginUrl}</span>
        </p>

        <div style="border-top:1px dashed #e5e7eb; margin:24px 0;"></div>

        <p style="font-size:13px; color:#ef4444; font-weight:600; margin-bottom:8px;">⚠ Important</p>
        <p style="font-size:13px; color:#6b7280; line-height:1.5; margin:0;">
          Please change your password immediately after your first login.
          Do not share these credentials with anyone.
        </p>

        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

        <p style="font-size:12px; color:#9ca3af; line-height:1.5; text-align:center; margin:0;">
          Umuhinzi Credit &mdash; Smart Agricultural Credit &amp; Financial Inclusion Platform
        </p>
      </div>
    </div>
  `;
};